import {addComponent, addEntity} from 'bitecs';
import {Context} from './Context'; // ваш Context с ecsWorld, assetManager, resources, components…
import {ComponentName, ComponentOverrides, PrefabData} from '../types'; // тип префаба

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

            for (const [field, rawValue] of Object.entries(mergedFields)) {
                if (typeof rawValue === 'string') {
                    // Вместо прямого доступа к cache:
                    if (!this.ctx.assetManager.hasAsset(rawValue)) {
                        throw new Error(`Asset "${rawValue}" not preloaded`);
                    }
                    (schema as any)[field][eid] = this.ctx.assetManager.getResourceId(rawValue);

                } else if (typeof rawValue === 'number' || Array.isArray(rawValue)) {
                    (schema as any)[field][eid] = rawValue as any;
                } else {
                    (schema as any)[field][eid] = rawValue as any;
                }
            }
        }

        return eid;
    }
}
