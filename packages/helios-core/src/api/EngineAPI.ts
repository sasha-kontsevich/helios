// src/api/EngineAPI.ts

import { extractComponentData } from "../utils/snapshot";
import {ComponentMap, EntitySnapshot} from "@merlinn/helios-core/types";
import {Context} from "@merlinn/helios-core/engine"; // функция для вытягивания данных по eid

export class EngineAPI {
    constructor(private context: Context) {}

    /** Получить snapshot по одной сущности */
    getEntitySnapshot(eid: number) {
        const { ecsWorld, components } = this.context;

        const snapshot: Record<string, any> = {};

        for (const [name, component] of Object.entries(this.context.components)) {
            if (component.__entitySet && component.__entitySet.has(eid)) {
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
        const { components } = this.context;

        // Собираем уникальные eid со всех компонентов
        const eids = new Set<number>();
        for (const comp of Object.values(components)) {
            if (comp.__entitySet) {
                for (const eid of comp.__entitySet) {
                    eids.add(eid);
                }
            }
        }

        const result: EntitySnapshot[] = [];

        for (const eid of eids) {
            result.push(this.getEntitySnapshot(eid));
        }

        return result;
    }

    /** Пример метода: получить компонент у сущности */
    getComponent<T>(eid: number, name: keyof ComponentMap): T | null {
        const comp = this.context.components.get(name);
        // if (!comp || !comp.__entitySet || !comp.__entitySet.has(eid)) {
        //     return null;
        // }

        return extractComponentData(comp, eid) as T;
    }

    /** Можно добавить методы для удаления, создания, сериализации и т.п. */
}
