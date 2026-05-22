import { addEntity, entityExists, hasComponent, removeEntity } from "bitecs";
import type { Context } from "./Context";
import type { ModelManifest } from "../types/ModelManifest";
import type { SceneEntityInstance } from "../types/SceneData";
import { ModelInstance } from "../components/model";
import { applyComponentsToEntity } from "./spawnEntityFromComponents";
import { applyParentLink, spawnSceneEntityInstances } from "./spawnEntitiesWithParent";
import { preloadManifestAssets } from "./preloadManifestAssets";

export interface SpawnModelInstanceOptions {
    parentEid?: number | null;
    position?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number; w: number };
    scale?: { x: number; y: number; z: number };
    name?: string;
    instanceId?: string;
    /** Extra registered components copied from a {@link ModelInstance} marker (e.g. game logic tags). */
    extraComponents?: Record<string, Record<string, unknown>>;
}

const MODEL_INSTANCE_MARKER_RESERVED = new Set([
    "ModelInstance",
    "Position",
    "Rotation",
    "Scale",
    "Parent",
    "Name",
]);

let nextModelInstanceSerial = 1;

function cloneComponents(
    components: Record<string, Record<string, unknown>>,
): Record<string, Record<string, unknown>> {
    const out: Record<string, Record<string, unknown>> = {};
    for (const [key, fields] of Object.entries(components)) {
        out[key] = { ...fields };
    }
    return out;
}

function prepareManifestInstances(
    manifest: ModelManifest,
    instanceId: string,
    wrapperEid: number,
): SceneEntityInstance[] {
    const idMap = new Map<string, string>();
    for (const inst of manifest.entities) {
        if (inst.id) {
            idMap.set(inst.id, `${instanceId}/${inst.id}`);
        }
    }

    const instances: SceneEntityInstance[] = [];
    for (const inst of manifest.entities) {
        if (inst.id === "root") {
            continue;
        }

        const components = cloneComponents(inst.components);
        if (components.Parent) {
            const raw = components.Parent.target;
            if (raw === "root") {
                components.Parent = { target: wrapperEid };
            } else if (typeof raw === "string" && idMap.has(raw)) {
                components.Parent = { target: idMap.get(raw)! };
            }
        }

        instances.push({
            id: inst.id ? idMap.get(inst.id) : undefined,
            components,
        });
    }

    return instances;
}

/**
 * Spawn from an in-memory manifest. Returns wrapper root entity id.
 */
export async function spawnModelManifest(
    ctx: Context,
    manifest: ModelManifest,
    options: SpawnModelInstanceOptions = {},
): Promise<number> {
    const instanceId = options.instanceId ?? `mi_${nextModelInstanceSerial++}`;
    const wrapperEid = addEntity(ctx.ecsWorld as never);

    const wrapperComponents: Record<string, Record<string, unknown>> = {
        Name: { label: options.name ?? manifest.name ?? "Model" },
    };
    if (options.position) wrapperComponents.Position = options.position;
    if (options.rotation) wrapperComponents.Rotation = options.rotation;
    if (options.scale) wrapperComponents.Scale = options.scale;
    if (options.extraComponents) {
        for (const [name, fields] of Object.entries(options.extraComponents)) {
            wrapperComponents[name] = fields;
        }
    }

    applyComponentsToEntity(ctx, wrapperEid, wrapperComponents);

    if (options.parentEid != null && entityExists(ctx.ecsWorld as never, options.parentEid)) {
        applyParentLink(ctx, wrapperEid, options.parentEid);
    }

    await preloadManifestAssets(ctx, manifest);
    const instances = prepareManifestInstances(manifest, instanceId, wrapperEid);
    spawnSceneEntityInstances(ctx, instances);

    return wrapperEid;
}

/** Load manifest asset by guid and spawn. */
export async function spawnModelInstance(
    ctx: Context,
    modelGuid: string,
    options: SpawnModelInstanceOptions = {},
): Promise<number> {
    await ctx.assetManager.loadAsset(modelGuid);
    const manifest = ctx.resources.get<ModelManifest>(
        ctx.assetManager.getResourceId(modelGuid),
    );
    await preloadManifestAssets(ctx, manifest);
    return spawnModelManifest(ctx, manifest, options);
}

/** Expand a {@link ModelInstance} marker entity into spawned mesh hierarchy. */
export async function expandModelInstanceMarker(ctx: Context, markerEid: number): Promise<number | null> {
    const world = ctx.ecsWorld as never;
    if (!entityExists(world, markerEid) || !hasComponent(world, ModelInstance as never, markerEid)) {
        return null;
    }

    const modelGuid = ModelInstance.get(markerEid).model as string;
    if (!modelGuid) {
        console.warn(`[Helios] ModelInstance on eid=${markerEid} has empty model guid`);
        return null;
    }

    const snap = ctx.engine.api.getEntitySnapshot(markerEid);
    const components = snap.components as Record<string, Record<string, unknown>>;

    const options: SpawnModelInstanceOptions = {
        name: (components.Name as { label?: string } | undefined)?.label,
    };
    if (components.Position) {
        options.position = components.Position as { x: number; y: number; z: number };
    }
    if (components.Rotation) {
        options.rotation = components.Rotation as { x: number; y: number; z: number; w: number };
    }
    if (components.Scale) {
        options.scale = components.Scale as { x: number; y: number; z: number };
    }
    if (components.Parent) {
        const target = (components.Parent as { target?: number }).target;
        if (typeof target === "number" && entityExists(world, target)) {
            options.parentEid = target;
        }
    }

    const registered = new Set(ctx.components.list());
    const extra: Record<string, Record<string, unknown>> = {};
    for (const [name, fields] of Object.entries(components)) {
        if (MODEL_INSTANCE_MARKER_RESERVED.has(name)) {
            continue;
        }
        if (!registered.has(name)) {
            continue;
        }
        extra[name] = { ...fields };
    }
    if (Object.keys(extra).length > 0) {
        options.extraComponents = extra;
    }

    removeEntity(world, markerEid);
    return spawnModelInstance(ctx, modelGuid, options);
}

/** Expand every {@link ModelInstance} marker in the world. */
export async function expandAllModelInstances(ctx: Context): Promise<void> {
    const world = ctx.ecsWorld as never;
    const markers = ctx.engine.api
        .getAllEntityIds()
        .filter((eid) => hasComponent(world, ModelInstance as never, eid));
    for (const eid of [...markers]) {
        await expandModelInstanceMarker(ctx, eid);
    }
}
