import type { GeometryDescriptor, MaterialDescriptor } from "./descriptors";

export type MeshEntityComponentMap = Record<string, Record<string, unknown>>;

export interface MeshEntityComponentsOptions {
    geometry: GeometryDescriptor;
    material: MaterialDescriptor;
    position?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number; w: number };
    scale?: { x: number; y: number; z: number };
    parent?: { target: number };
    name?: { label: string };
    extra?: Record<string, Record<string, unknown>>;
}

/**
 * Serializable component map for a mesh entity (renderer-agnostic).
 * Three-plugin adds {@link ThreeObject} / {@link ThreeMesh} at runtime.
 */
export function meshEntityComponents(opts: MeshEntityComponentsOptions): MeshEntityComponentMap {
    const map: MeshEntityComponentMap = {
        Mesh: {},
        Geometry: {
            descriptor: opts.geometry,
        },
        Material: {
            descriptor: opts.material,
        },
    };

    if (opts.name) {
        map.Name = opts.name;
    }
    if (opts.position) {
        map.Position = opts.position;
    }
    if (opts.rotation) {
        map.Rotation = opts.rotation;
    }
    if (opts.scale) {
        map.Scale = opts.scale;
    }
    if (opts.parent) {
        map.Parent = opts.parent;
    }
    if (opts.extra) {
        for (const [key, value] of Object.entries(opts.extra)) {
            map[key] = value;
        }
    }

    return map;
}
