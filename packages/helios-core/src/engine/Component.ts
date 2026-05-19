import { defineComponent as bitecsDefineComponent, Types } from 'bitecs';

const PrimitiveTypes = new Set(Object.values(Types));
const globalResourceMap = new Map<number, any>();
let nextResourceId = 1;

function addResource(resource: any): number {
    const id = nextResourceId++;
    globalResourceMap.set(id, resource);
    return id;
}

function getResource<T>(id: number): T {
    return globalResourceMap.get(id);
}

type PrimitiveType = keyof typeof Types;
type PrimitiveTypeValue = (typeof Types)[PrimitiveType];

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

// 💡 Делаем proxy-тип на основе исходной схемы
type ProxyAccess<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends PrimitiveTypeValue ? number : T[K];
};

// 💡 Делаем компонент с полями-массивами чисел, но ресурсы остаются ui32
type Component<T extends Record<string, any>> = Expand<{
    [K in keyof T]: number[];
}> & {
    get(eid: number): ProxyAccess<T>;
};

export function defineComponent<T extends Record<string, any>>(schema: T): Component<T> {
    const numericSchema: Record<string, PrimitiveTypeValue> = {};

    for (const key in schema) {
        const type = schema[key];
        if (type == null) {
            throw new Error(`[Helios] defineComponent: field "${key}" has undefined type`);
        }
        numericSchema[key] = PrimitiveTypes.has(type) ? type : Types.ui32;
    }

    const component = bitecsDefineComponent(numericSchema) as any;

    component.get = (eid: number) => {
        return new Proxy({}, {
            get(_, prop: string) {
                if (!(prop in schema)) return undefined;
                const type = schema[prop];
                if (PrimitiveTypes.has(type)) {
                    return component[prop][eid];
                } else {
                    const id = component[prop][eid];
                    return getResource(id);
                }
            },
            set(_, prop: string, value: any) {
                if (!(prop in schema)) return false;
                const type = schema[prop];
                if (PrimitiveTypes.has(type)) {
                    component[prop][eid] = value;
                } else {
                    component[prop][eid] = addResource(value);
                }
                return true;
            },
        }) as ProxyAccess<T>;
    };

    return component;
}
