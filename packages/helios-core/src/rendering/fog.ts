/** {@link Fog.type}: linear distance fog (`THREE.Fog`). */
export const FOG_TYPE_LINEAR = 0 as const;
/** {@link Fog.type}: exponential squared fog (`THREE.FogExp2`). */
export const FOG_TYPE_EXP2 = 1 as const;

export type FogType = typeof FOG_TYPE_LINEAR | typeof FOG_TYPE_EXP2;

export function parseFogType(value: unknown): FogType {
    if (value === FOG_TYPE_EXP2 || value === 1) {
        return FOG_TYPE_EXP2;
    }
    if (typeof value === "string") {
        const t = value.trim().toLowerCase();
        if (t === "exp2" || t === "exponential" || t === "exp") {
            return FOG_TYPE_EXP2;
        }
    }
    return FOG_TYPE_LINEAR;
}

/** Parse scene/inspector color as 0xRRGGBB integer. */
export function parseFogColor(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value >>> 0;
    }
    if (typeof value === "string") {
        const s = value.trim();
        if (s.startsWith("#")) {
            return Number.parseInt(s.slice(1), 16) >>> 0;
        }
        if (s.startsWith("0x") || s.startsWith("0X")) {
            return Number.parseInt(s.slice(2), 16) >>> 0;
        }
    }
    return 0xcccccc;
}

export function normalizeFogSpawnFields(
    fields: Record<string, unknown>,
): Record<string, unknown> {
    return {
        type: parseFogType(fields.type ?? FOG_TYPE_LINEAR),
        color: parseFogColor(fields.color ?? 0xcccccc),
        near: typeof fields.near === "number" && Number.isFinite(fields.near) ? fields.near : 1,
        far: typeof fields.far === "number" && Number.isFinite(fields.far) ? fields.far : 1000,
        density:
            typeof fields.density === "number" && Number.isFinite(fields.density)
                ? fields.density
                : 0.00025,
    };
}
