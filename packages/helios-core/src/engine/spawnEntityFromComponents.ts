import { addComponent, addEntity, hasComponent, removeComponent } from 'bitecs';
import type { Context } from './Context';
import type { ComponentMap } from '../types';
import { normalizeRotationSpawnFields } from '../utils/rotation';

/**
 * Writes prefab/scene field values onto bitecs component storage for one entity.
 */
export function applyComponentFields(
    ctx: Context,
    componentName: string,
    schema: Record<string, unknown>,
    eid: number,
    fields: Record<string, unknown>,
): void {
    const comp = schema as Record<string, unknown> & { get?: (eid: number) => Record<string, unknown> };

    for (const [field, rawValue] of Object.entries(fields)) {
        if (
            (componentName === "Geometry" ||
                componentName === "Material" ||
                componentName === "Skybox") &&
            (field === "guid" || field === "texture") &&
            typeof rawValue === "string"
        ) {
            if (typeof comp.get !== "function") {
                throw new Error(`[Helios] ${componentName}.guid requires defineComponent proxy storage`);
            }
            comp.get(eid)[field] = rawValue;
            continue;
        }
        if (typeof rawValue === 'string') {
            if (ctx.assetManager.hasAsset(rawValue)) {
                (comp as any)[field][eid] = ctx.assetManager.getResourceId(rawValue);
            } else if (typeof comp.get === 'function') {
                // Literal strings (e.g. {@link Name}.label), not asset GUIDs.
                comp.get(eid)[field] = rawValue;
            } else {
                throw new Error(`Asset "${rawValue}" not preloaded`);
            }
        } else if (typeof rawValue === 'number' || Array.isArray(rawValue)) {
            (comp as any)[field][eid] = rawValue as number | number[];
        } else if (rawValue !== null && typeof rawValue === 'object') {
            // Prefer defineComponent proxy resources when available (so snapshots can resolve objects).
            if (typeof comp.get === "function") {
                comp.get(eid)[field] = rawValue as never;
            } else {
                const id = ctx.resources.set(rawValue);
                (comp as any)[field][eid] = id;
            }
        } else {
            (comp as any)[field][eid] = rawValue;
        }
    }
}

/**
 * Adds listed components and applies serialized field values (same rules as prefabs).
 */
export function applyComponentsToEntity(
    ctx: Context,
    eid: number,
    components: Record<string, Record<string, unknown>>,
): void {
    const registered = ctx.components.list();
    for (const [compName, fields] of Object.entries(components)) {
        if (!registered.includes(compName)) {
            console.warn(`[Helios] Unknown component "${compName}", skipping`);
            continue;
        }
        const schema = ctx.components.get(compName as keyof ComponentMap);
        addComponent(ctx.ecsWorld, schema, eid);
        const payload =
            compName === "Rotation" ? normalizeRotationSpawnFields(fields) : fields;
        applyComponentFields(ctx, compName, schema as unknown as Record<string, unknown>, eid, payload);
    }
}

export function spawnEntityFromComponentMap(
    ctx: Context,
    components: Record<string, Record<string, unknown>>,
): number {
    const eid = addEntity(ctx.ecsWorld);
    applyComponentsToEntity(ctx, eid, components);
    return eid;
}

/**
 * Replace or add components on an existing entity (removes each component first if present,
 * then applies serialized fields — same rules as {@link applyComponentsToEntity}).
 */
export function mergeComponentMapOntoEntity(
    ctx: Context,
    eid: number,
    components: Record<string, Record<string, unknown>>,
): void {
    const world = ctx.ecsWorld as any;
    const registered = ctx.components.list();
    for (const [compName, fields] of Object.entries(components)) {
        if (!registered.includes(compName)) {
            console.warn(`[Helios] Unknown component "${compName}", skipping`);
            continue;
        }
        const schema = ctx.components.get(compName as keyof ComponentMap);
        if (hasComponent(world, schema, eid)) {
            removeComponent(world, schema, eid);
        }
        addComponent(world, schema, eid);
        const payload =
            compName === "Rotation" ? normalizeRotationSpawnFields(fields) : fields;
        applyComponentFields(ctx, compName, schema as unknown as Record<string, unknown>, eid, payload);
    }
}
