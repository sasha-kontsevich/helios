const GRID_MAT = {
    type: "meshStandard" as const,
    color: 0x4a5568,
    roughness: 0.92,
    metalness: 0.05,
    wireframe: false,
};

/** Thin box along X at fixed Z (Game of Life board lines on XZ). */
export function gridLineAlongX(half: number, z: number): Record<string, Record<string, unknown>> {
    const len = 2 * half + 1;
    return {
        Name: { label: "Grid" },
        Position: { x: 0, y: 0.01, z },
        Rotation: { x: 0, y: 0, z: 0 },
        ThreeObject: {},
        ThreeMesh: {},
        ThreeGeometryRef: {
            descriptor: { type: "box", width: len, height: 0.02, depth: 0.06 },
        },
        ThreeMaterialRef: { descriptor: GRID_MAT },
    };
}

/** Thin box along Z at fixed X. */
export function gridLineAlongZ(half: number, x: number): Record<string, Record<string, unknown>> {
    const len = 2 * half + 1;
    return {
        Name: { label: "Grid" },
        Position: { x, y: 0.01, z: 0 },
        Rotation: { x: 0, y: 0, z: 0 },
        ThreeObject: {},
        ThreeMesh: {},
        ThreeGeometryRef: {
            descriptor: { type: "box", width: 0.06, height: 0.02, depth: len },
        },
        ThreeMaterialRef: { descriptor: GRID_MAT },
    };
}
