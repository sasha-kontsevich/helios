import { addComponent, addEntity } from 'bitecs';
import { Context } from './Context';
import { ComponentName, ComponentOverrides, PrefabData } from '../types';
import { applyComponentFields } from './spawnEntityFromComponents';

export class PrefabManager {
    private prefabs = new Map<string, PrefabData>();

    constructor(private ctx: Context) {}

    /** Зарегистрировать префаб под GUID */
    register(guid: string, prefab: PrefabData): void {
        this.prefabs.set(guid, prefab);
    }

    /**
     * Инстанцировать префаб.
     * @param guidOrData — либо GUID, либо сразу объект PrefabData
     * @param overrides
     * @returns entityId
     */
    instantiate(guidOrData: string | PrefabData, overrides?: ComponentOverrides): number {
        // 1) получаем PrefabData
        const prefab: PrefabData = typeof guidOrData === 'string'
            ? (this.prefabs.get(guidOrData)
                ?? (() => { throw new Error(`Prefab "${guidOrData}" not found`); })())
            : guidOrData;

        // 2) создаём новую сущность
        const eid = addEntity(this.ctx.ecsWorld);

        const componentNames = Object.keys(prefab.components) as ComponentName[];

        // 3) для каждого компонента из префаба
        for (const compName of componentNames) {
            const baseFields = prefab.components[compName]!;
            const overrideFields = overrides?.[compName];
            const mergedFields = {
                ...baseFields,
                ...(overrideFields ?? {})
            };

            const schema = this.ctx.components.get(compName);
            if (!schema) {
                console.warn(`Component schema "${compName}" not registered`);
                continue;
            }

            // навешиваем компонент
            addComponent(this.ctx.ecsWorld, schema, eid);
            applyComponentFields(
                this.ctx,
                schema as unknown as Record<string, unknown>,
                eid,
                mergedFields as Record<string, unknown>,
            );
        }

        return eid;
    }
}
