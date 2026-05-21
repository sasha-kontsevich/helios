/**
 * Component map for one Game of Life cell (simulation only; drawn by {@link LifeCellInstancedRenderSystem}).
 */
export function lifeCellComponentMap(
    gx: number,
    gz: number,
    parentEid: number,
): Record<string, Record<string, unknown>> {
    return {
        Name: { label: "Cell" },
        Parent: { target: parentEid },
        LifeCell: { gx, gz },
    };
}
