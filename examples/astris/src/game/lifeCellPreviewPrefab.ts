import { meshEntityComponents } from "@merlinn/helios-core";
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
    return meshEntityComponents({
        geometry: { type: "box", width: 0.95, height: 0.95, depth: 0.95 },
        material: {
            type: "meshStandard",
            color: mat.color,
            roughness: mat.roughness,
            metalness: mat.metalness,
            wireframe: false,
        },
        name: { label: "PreviewCell" },
        parent: { target: parentEid },
        position: { x: gx, y: 0.5, z: gz },
        rotation: { x: 0, y: 0, z: 0 },
        extra: {
            LifeCellPreview: { gx, gz },
        },
    });
}
