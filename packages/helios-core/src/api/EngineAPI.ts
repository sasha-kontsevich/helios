// src/api/EngineAPI.ts

import { extractComponentData } from "../utils/snapshot";
import { ComponentMap, EntitySnapshot } from "../types";
import { Context } from "../engine/Context";
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
        patch: Record<string, number>,
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
            if (typeof value !== "number" || !Number.isFinite(value)) continue;
            const storage = comp[key];
            if (storage == null || typeof storage === "function") continue;
            if (Array.isArray(storage) || (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(storage))) {
                (storage as ArrayLike<number> & { [i: number]: number })[eid] = value;
            }
        }
    }

    /** Можно добавить методы для удаления, создания, сериализации и т.п. */
}
