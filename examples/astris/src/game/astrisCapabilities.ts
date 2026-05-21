/** Queue consumed by {@link GameOfLifePointerDrainSystem}. */
export const ASTRIS_GRID_CLICK_QUEUE_CAPABILITY = "astris.gridClickQueue";

/** Paint vs erase tool for grid pointer sink (HUD segmented control). */
export const ASTRIS_GOL_TOOL_CAPABILITY = "astris.golTool";

/** Live generation counter and cell count (updated by {@link GameOfLifeStepSystem}). */
export const ASTRIS_GOL_STATS_CAPABILITY = "astris.golStats";

/** Hover intent for {@link GolHoverSyncSystem} (instanced mesh preview). */
export const ASTRIS_GOL_HOVER_CAPABILITY = "astris.golHover";

/** O(1) set of occupied {@link LifeCell} grid coordinates. */
export const ASTRIS_GOL_CELL_INDEX_CAPABILITY = "astris.golCellIndex";

/** Pattern armed for next LMB placement (HUD preset buttons). */
export const ASTRIS_GOL_ARMED_PRESET_CAPABILITY = "astris.golArmedPreset";

export type GolToolMode = "paint" | "erase";

export type GolHoverPreviewKind = "place" | "erase" | "preset" | "toggleRemove";

export interface GolToolState {
    mode: GolToolMode;
}

export interface GolStatsState {
    generation: number;
    aliveCount: number;
}

export interface GolHoverState {
    active: boolean;
    originGx: number;
    originGz: number;
    kind: GolHoverPreviewKind;
}

export interface GolArmedPresetState {
    presetId: GolPresetId | null;
}

/** Set in {@link golPresets.ts} to avoid circular imports in types. */
export type GolPresetId =
    | "glider"
    | "blinker"
    | "toad"
    | "beacon"
    | "lwss"
    | "block"
    | "beehive"
    | "rpentomino"
    | "pulsar"
    | "pentadecathlon"
    | "gosperGun"
    | "simkinGun"
    | "queenBee"
    | "diehard"
    | "rabbits"
    | "acorn";

export function createDefaultGolToolState(): GolToolState {
    return { mode: "paint" };
}

export function createDefaultGolStatsState(): GolStatsState {
    return { generation: 0, aliveCount: 0 };
}

export function createDefaultGolHoverState(): GolHoverState {
    return { active: false, originGx: 0, originGz: 0, kind: "place" };
}

export function createDefaultGolArmedPresetState(): GolArmedPresetState {
    return { presetId: null };
}
