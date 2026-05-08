import { addComponent, addEntity } from 'bitecs';
import type { Context } from './Context';
import type { ComponentMap } from '../types';

/**
 * Writes prefab/scene field values onto bitecs component storage for one entity.
 */
export function applyComponentFields(
    ctx: Context,
    schema: Record<string, unknown>,
    eid: number,
    fields: Record<string, unknown>,
): void {
    const comp = schema as Record<string, unknown> & { get?: (eid: number) => Record<string, unknown> };

    for (const [field, rawValue] of Object.entries(fields)) {
        if (typeof rawValue === 'string') {
            if (!ctx.assetManager.hasAsset(rawValue)) {
                throw new Error(`Asset "${rawValue}" not preloaded`);
            }
            (comp as any)[field][eid] = ctx.assetManager.getResourceId(rawValue);
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
        applyComponentFields(ctx, schema as unknown as Record<string, unknown>, eid, fields);
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
