/** Minimum segment counts for stable geometry validation. */
export const MIN_SEGMENTS = 3;
export const MIN_PLANE_SEGMENTS = 1;

/* ─── Geometry ─────────────────────────────────────────────────────────────── */

export interface GeometryDescriptorBox {
    type: "box";
    width: number;
    height: number;
    depth: number;
}

export interface GeometryDescriptorSphere {
    type: "sphere";
    radius: number;
    widthSegments: number;
    heightSegments: number;
}

export interface GeometryDescriptorPlane {
    type: "plane";
    width: number;
    height: number;
    widthSegments: number;
    heightSegments: number;
}

export interface GeometryDescriptorCylinder {
    type: "cylinder";
    radiusTop: number;
    radiusBottom: number;
    height: number;
    radialSegments: number;
}

export interface GeometryDescriptorCone {
    type: "cone";
    radius: number;
    height: number;
    radialSegments: number;
}

export interface GeometryDescriptorTorus {
    type: "torus";
    radius: number;
    tube: number;
    radialSegments: number;
    tubularSegments: number;
}

export type GeometryDescriptor =
    | GeometryDescriptorBox
    | GeometryDescriptorSphere
    | GeometryDescriptorPlane
    | GeometryDescriptorCylinder
    | GeometryDescriptorCone
    | GeometryDescriptorTorus;

export const DEFAULT_BOX: GeometryDescriptorBox = { type: "box", width: 1, height: 1, depth: 1 };
export const DEFAULT_SPHERE: GeometryDescriptorSphere = {
    type: "sphere",
    radius: 1,
    widthSegments: 32,
    heightSegments: 16,
};
export const DEFAULT_PLANE: GeometryDescriptorPlane = {
    type: "plane",
    width: 1,
    height: 1,
    widthSegments: 1,
    heightSegments: 1,
};
export const DEFAULT_CYLINDER: GeometryDescriptorCylinder = {
    type: "cylinder",
    radiusTop: 1,
    radiusBottom: 1,
    height: 1,
    radialSegments: 32,
};
export const DEFAULT_CONE: GeometryDescriptorCone = { type: "cone", radius: 1, height: 1, radialSegments: 32 };
export const DEFAULT_TORUS: GeometryDescriptorTorus = {
    type: "torus",
    radius: 1,
    tube: 0.4,
    radialSegments: 16,
    tubularSegments: 48,
};

export const DEFAULT_GEOMETRY: Record<GeometryDescriptor["type"], GeometryDescriptor> = {
    box: DEFAULT_BOX,
    sphere: DEFAULT_SPHERE,
    plane: DEFAULT_PLANE,
    cylinder: DEFAULT_CYLINDER,
    cone: DEFAULT_CONE,
    torus: DEFAULT_TORUS,
};

export function defaultGeometryDescriptor(type: GeometryDescriptor["type"]): GeometryDescriptor {
    const d = DEFAULT_GEOMETRY[type];
    return { ...d };
}

function clampSeg(n: unknown, fallback: number, min = MIN_SEGMENTS): number {
    if (typeof n !== "number" || !Number.isFinite(n)) return Math.max(min, Math.floor(fallback));
    return Math.max(min, Math.floor(n));
}

function clampPlaneSeg(n: unknown, fallback: number): number {
    if (typeof n !== "number" || !Number.isFinite(n)) {
        return Math.max(MIN_PLANE_SEGMENTS, Math.floor(fallback));
    }
    return Math.max(MIN_PLANE_SEGMENTS, Math.floor(n));
}

function clampPositive(n: unknown, fallback: number): number {
    if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return fallback;
    return n;
}

/** Parse and normalize a geometry descriptor from JSON/editor; returns null if invalid. */
export function parseGeometryDescriptor(v: unknown): GeometryDescriptor | null {
    if (typeof v !== "object" || v === null) return null;
    const t = (v as { type?: unknown }).type;
    if (typeof t !== "string") return null;

    switch (t) {
        case "box": {
            const o = v as GeometryDescriptorBox;
            if (
                typeof o.width !== "number" ||
                typeof o.height !== "number" ||
                typeof o.depth !== "number" ||
                ![o.width, o.height, o.depth].every((x) => Number.isFinite(x) && x > 0)
            ) {
                return null;
            }
            return { type: "box", width: o.width, height: o.height, depth: o.depth };
        }
        case "sphere": {
            const o = v as GeometryDescriptorSphere;
            const radius = clampPositive(o.radius, DEFAULT_SPHERE.radius);
            return {
                type: "sphere",
                radius,
                widthSegments: clampSeg(o.widthSegments, DEFAULT_SPHERE.widthSegments),
                heightSegments: clampSeg(o.heightSegments, DEFAULT_SPHERE.heightSegments),
            };
        }
        case "plane": {
            const o = v as GeometryDescriptorPlane;
            const width = clampPositive(o.width, DEFAULT_PLANE.width);
            const height = clampPositive(o.height, DEFAULT_PLANE.height);
            return {
                type: "plane",
                width,
                height,
                widthSegments: clampPlaneSeg(o.widthSegments, DEFAULT_PLANE.widthSegments),
                heightSegments: clampPlaneSeg(o.heightSegments, DEFAULT_PLANE.heightSegments),
            };
        }
        case "cylinder": {
            const o = v as GeometryDescriptorCylinder;
            const radiusTop = clampPositive(o.radiusTop, DEFAULT_CYLINDER.radiusTop);
            const radiusBottom = clampPositive(o.radiusBottom, DEFAULT_CYLINDER.radiusBottom);
            const height = clampPositive(o.height, DEFAULT_CYLINDER.height);
            return {
                type: "cylinder",
                radiusTop,
                radiusBottom,
                height,
                radialSegments: clampSeg(o.radialSegments, DEFAULT_CYLINDER.radialSegments),
            };
        }
        case "cone": {
            const o = v as GeometryDescriptorCone;
            return {
                type: "cone",
                radius: clampPositive(o.radius, DEFAULT_CONE.radius),
                height: clampPositive(o.height, DEFAULT_CONE.height),
                radialSegments: clampSeg(o.radialSegments, DEFAULT_CONE.radialSegments),
            };
        }
        case "torus": {
            const o = v as GeometryDescriptorTorus;
            const radius = clampPositive(o.radius, DEFAULT_TORUS.radius);
            const tube = clampPositive(o.tube, DEFAULT_TORUS.tube);
            return {
                type: "torus",
                radius,
                tube,
                radialSegments: clampSeg(o.radialSegments, DEFAULT_TORUS.radialSegments),
                tubularSegments: clampSeg(o.tubularSegments, DEFAULT_TORUS.tubularSegments),
            };
        }
        default:
            return null;
    }
}

/* ─── Materials ────────────────────────────────────────────────────────────── */

export interface MaterialDescriptorMeshBasic {
    type: "meshBasic";
    color: number;
    wireframe?: boolean;
    /** Albedo / diffuse map (`guid://…` texture asset). */
    map?: string;
}

export interface MaterialDescriptorMeshLambert {
    type: "meshLambert";
    color: number;
    wireframe?: boolean;
    emissive?: number;
    map?: string;
    emissiveMap?: string;
}

export interface MaterialDescriptorMeshStandard {
    type: "meshStandard";
    color: number;
    roughness: number;
    metalness: number;
    wireframe?: boolean;
    map?: string;
    normalMap?: string;
    roughnessMap?: string;
    metalnessMap?: string;
    aoMap?: string;
    emissiveMap?: string;
}

export type MaterialDescriptor =
    | MaterialDescriptorMeshBasic
    | MaterialDescriptorMeshLambert
    | MaterialDescriptorMeshStandard;

export const DEFAULT_MATERIAL_BASIC: MaterialDescriptorMeshBasic = {
    type: "meshBasic",
    color: 0xffffff,
    wireframe: false,
};
export const DEFAULT_MATERIAL_LAMBERT: MaterialDescriptorMeshLambert = {
    type: "meshLambert",
    color: 0xffffff,
    wireframe: false,
    emissive: 0x000000,
};
export const DEFAULT_MATERIAL_STANDARD: MaterialDescriptorMeshStandard = {
    type: "meshStandard",
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
    wireframe: false,
};

export const DEFAULT_MATERIAL: Record<MaterialDescriptor["type"], MaterialDescriptor> = {
    meshBasic: DEFAULT_MATERIAL_BASIC,
    meshLambert: DEFAULT_MATERIAL_LAMBERT,
    meshStandard: DEFAULT_MATERIAL_STANDARD,
};

export function defaultMaterialDescriptor(type: MaterialDescriptor["type"]): MaterialDescriptor {
    const d = DEFAULT_MATERIAL[type];
    return { ...d };
}

function clampColor(n: unknown, fallback: number): number {
    if (typeof n !== "number" || !Number.isFinite(n)) return fallback & 0xffffff;
    return Math.min(0xffffff, Math.max(0, Math.floor(n)));
}

function clampUnit(n: unknown, fallback: number): number {
    if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
    return Math.min(1, Math.max(0, n));
}

function parseOptionalTextureGuid(v: unknown): string | undefined {
    if (typeof v !== "string") return undefined;
    const s = v.trim();
    return s.length > 0 ? s : undefined;
}

function copyTextureSlots<T extends MaterialDescriptor>(
    target: T,
    source: Record<string, unknown>,
    slots: readonly string[],
): void {
    for (const slot of slots) {
        const guid = parseOptionalTextureGuid(source[slot]);
        if (guid) {
            (target as unknown as Record<string, unknown>)[slot] = guid;
        }
    }
}

/** Parse and normalize a material descriptor from JSON/editor; returns null if invalid. */
export function parseMaterialDescriptor(v: unknown): MaterialDescriptor | null {
    if (typeof v !== "object" || v === null) return null;
    const t = (v as { type?: unknown }).type;
    if (typeof t !== "string") return null;

    switch (t) {
        case "meshBasic": {
            const o = v as MaterialDescriptorMeshBasic;
            if (typeof o.color !== "number" || !Number.isFinite(o.color)) return null;
            const base: MaterialDescriptorMeshBasic = {
                type: "meshBasic",
                color: clampColor(o.color, DEFAULT_MATERIAL_BASIC.color),
                wireframe: Boolean(o.wireframe),
            };
            copyTextureSlots(base, o as unknown as Record<string, unknown>, ["map"]);
            return base;
        }
        case "meshLambert": {
            const o = v as MaterialDescriptorMeshLambert;
            if (typeof o.color !== "number" || !Number.isFinite(o.color)) return null;
            const base: MaterialDescriptorMeshLambert = {
                type: "meshLambert",
                color: clampColor(o.color, DEFAULT_MATERIAL_LAMBERT.color),
                wireframe: Boolean(o.wireframe),
            };
            if (o.emissive !== undefined) {
                base.emissive = clampColor(o.emissive, DEFAULT_MATERIAL_LAMBERT.emissive ?? 0);
            }
            copyTextureSlots(base, o as unknown as Record<string, unknown>, ["map", "emissiveMap"]);
            return base;
        }
        case "meshStandard": {
            const o = v as MaterialDescriptorMeshStandard;
            if (typeof o.color !== "number" || !Number.isFinite(o.color)) return null;
            const base: MaterialDescriptorMeshStandard = {
                type: "meshStandard",
                color: clampColor(o.color, DEFAULT_MATERIAL_STANDARD.color),
                roughness: clampUnit(o.roughness, DEFAULT_MATERIAL_STANDARD.roughness),
                metalness: clampUnit(o.metalness, DEFAULT_MATERIAL_STANDARD.metalness),
                wireframe: Boolean(o.wireframe),
            };
            copyTextureSlots(base, o as unknown as Record<string, unknown>, [
                "map",
                "normalMap",
                "roughnessMap",
                "metalnessMap",
                "aoMap",
                "emissiveMap",
            ]);
            return base;
        }
        default:
            return null;
    }
}
