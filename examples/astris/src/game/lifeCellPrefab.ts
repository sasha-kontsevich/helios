/**
 * Component map for one Game of Life cell (box on integer grid XZ, center Y=0.5).
 * Shared by pointer drain and step systems.
 */
export function lifeCellComponentMap(gx: number, gz: number): Record<string, Record<string, unknown>> {
    return {
        Name: { label: "Cell" },
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
                color: 0x44aa88,
                roughness: 0.55,
                metalness: 0.15,
                wireframe: false,
            },
        },
        LifeCell: { gx, gz },
    };
}
