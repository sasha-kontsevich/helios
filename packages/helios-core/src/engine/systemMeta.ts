import type { System } from "./System";

export interface SystemMeta {
    readonly name: string;
    readonly description: string;
}

type SystemCtor = typeof System & {
    systemName?: string;
    systemDescription?: string;
};

/** Stable {@link SystemMeta.name} and tooltip text from static class fields. */
export function readSystemMeta(ctor: Function): SystemMeta {
    const c = ctor as SystemCtor;
    const name = c.systemName;
    if (typeof name !== "string" || name.length === 0) {
        throw new Error(
            `[Helios] ${ctor.name || "AnonymousSystem"} must declare static readonly systemName`,
        );
    }
    const description =
        typeof c.systemDescription === "string" ? c.systemDescription : "";
    return { name, description };
}

export function readSystemMetaFromInstance(system: System): SystemMeta {
    return readSystemMeta(system.constructor);
}
