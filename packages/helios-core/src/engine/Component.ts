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

// Мапим схему в поля bitecs
type NumericComponentFields<T> = {
    [K in keyof T as T[K] extends PrimitiveTypeValue ? K : never]: number[];
};

// Прокси-доступ к значениям
type ProxyAccess<T> = {
    [K in keyof T]: T[K] extends PrimitiveTypeValue ? number : any;
};

// Главный тип результата
type Component<T> = NumericComponentFields<T> & {
    get(eid: number): ProxyAccess<T>;
};

export function defineComponent<T extends Record<string, any>>(schema: T): Component<T> {
    const numericSchema: Record<string, PrimitiveTypeValue> = {};

    for (const key in schema) {
        const type = schema[key];
        if (PrimitiveTypes.has(type)) {
            numericSchema[key] = type;
        } else {
            numericSchema[key] = Types.ui32;
        }
    }

    const component = bitecsDefineComponent(numericSchema) as unknown as Component<T>;

    component.get = (eid: number) => {
        return new Proxy({}, {
            get(_, prop: string) {
                if (!(prop in schema)) return undefined;
                const type = schema[prop];
                if (PrimitiveTypes.has(type)) {
                    return (component as any)[prop][eid];
                } else {
                    const id = (component as any)[prop][eid];
                    return getResource(id);
                }
            },
            set(_, prop: string, value: any) {
                if (!(prop in schema)) return false;
                const type = schema[prop];
                if (PrimitiveTypes.has(type)) {
                    (component as any)[prop][eid] = value;
                } else {
                    (component as any)[prop][eid] = addResource(value);
                }
                return true;
            },
        }) as ProxyAccess<T>;
    };

    return component;
}
