import { meshEntityComponents } from "@merlinn/helios-core";

/**
 * Component map for one Game of Life cell (box on integer grid XZ, center Y=0.5).
 * Shared by pointer drain and step systems.
 */
export function lifeCellComponentMap(
    gx: number,
    gz: number,
    parentEid: number,
): Record<string, Record<string, unknown>> {
    return meshEntityComponents({
        geometry: { type: "box", width: 0.95, height: 0.95, depth: 0.95 },
        material: {
            type: "meshStandard",
            color: 0x44aa88,
            roughness: 0.55,
            metalness: 0.15,
            wireframe: false,
        },
        name: { label: "Cell" },
        parent: { target: parentEid },
        position: { x: gx, y: 0.5, z: gz },
        rotation: { x: 0, y: 0, z: 0 },
        extra: {
            LifeCell: { gx, gz },
        },
    });
}
