import type { GolHoverPreviewKind } from "./astrisCapabilities";

const PREVIEW_MATERIALS: Record<
    GolHoverPreviewKind,
    { color: number; roughness: number; metalness: number }
> = {
    place: { color: 0x44aa88, roughness: 0.55, metalness: 0.1 },
    erase: { color: 0xe85d5d, roughness: 0.55, metalness: 0.1 },
    preset: { color: 0x5fd4a8, roughness: 0.55, metalness: 0.1 },
    toggleRemove: { color: 0xc09050, roughness: 0.55, metalness: 0.1 },
};

/**
 * ECS prefab for one hover-preview cell (same mesh pipeline as {@link lifeCellComponentMap}).
 */
export function lifeCellPreviewComponentMap(
    gx: number,
    gz: number,
    parentEid: number,
    kind: GolHoverPreviewKind,
): Record<string, Record<string, unknown>> {
    const mat = PREVIEW_MATERIALS[kind];
    return {
        Name: { label: "PreviewCell" },
        Parent: { target: parentEid },
        Position: { x: gx, y: 0.5, z: gz },
        Rotation: { x: 0, y: 0, z: 0 },
        ThreeObject: {},
        ThreeMesh: {},
        ThreeGeometryRef: {
            descriptor: { type: "box", width: 0.95, height: 0.95, depth: 0.95 },
        },
        ThreeMaterialRef: {
            descriptor: {
                type: "meshStandard",
                color: mat.color,
                roughness: mat.roughness,
                metalness: mat.metalness,
                wireframe: false,
            },
        },
        LifeCellPreview: { gx, gz },
    };
}
