import { meshEntityComponents, type GeometryDescriptor } from "@merlinn/helios-core";

const GRID_MAT = {
    type: "meshStandard" as const,
    color: 0x4a5568,
    roughness: 0.92,
    metalness: 0.05,
    wireframe: false,
};

/** Empty parent for all floor grid line meshes. */
export function gridRootComponents(): Record<string, Record<string, unknown>> {
    return {
        Name: { label: "Grid" },
    };
}

function gridLineBase(
    position: { x: number; y: number; z: number },
    geometry: Record<string, unknown>,
    parentEid: number,
): Record<string, Record<string, unknown>> {
    return meshEntityComponents({
        geometry: geometry as GeometryDescriptor,
        material: GRID_MAT,
        name: { label: "GridLine" },
        parent: { target: parentEid },
        position,
        rotation: { x: 0, y: 0, z: 0 },
    });
}

/** Thin box along X at fixed Z (Game of Life board lines on XZ). */
export function gridLineAlongX(
    half: number,
    z: number,
    parentEid: number,
): Record<string, Record<string, unknown>> {
    const len = 2 * half + 1;
    return gridLineBase({ x: 0, y: 0.01, z }, { type: "box", width: len, height: 0.02, depth: 0.06 }, parentEid);
}

/** Thin box along Z at fixed X. */
export function gridLineAlongZ(
    half: number,
    x: number,
    parentEid: number,
): Record<string, Record<string, unknown>> {
    const len = 2 * half + 1;
    return gridLineBase({ x, y: 0.01, z: 0 }, { type: "box", width: 0.06, height: 0.02, depth: len }, parentEid);
}
