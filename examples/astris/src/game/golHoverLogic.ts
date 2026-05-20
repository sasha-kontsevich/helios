import type { Engine } from "@merlinn/helios-core";
import {
    ASTRIS_GOL_ARMED_PRESET_CAPABILITY,
    ASTRIS_GOL_HOVER_CAPABILITY,
    ASTRIS_GOL_TOOL_CAPABILITY,
    type GolArmedPresetState,
    type GolHoverPreviewKind,
    type GolHoverState,
    type GolToolState,
} from "./astrisCapabilities";
import { livingCellKeys, mapPresetCellsToWorld } from "./golPresets";

export const HOVER_PREVIEW_MAX_CELLS = 128;

export interface HoverCellsResult {
    active: boolean;
    originGx: number;
    originGz: number;
    kind: GolHoverPreviewKind;
    cells: Array<readonly [number, number]>;
}

function clearHover(hover: GolHoverState): void {
    hover.active = false;
    hover.kind = "place";
}

/** Desired preview cells from pointer origin (used by {@link GolHoverSyncSystem}). */
export function computeHoverCells(
    engine: Engine,
    originGx: number,
    originGz: number,
): HoverCellsResult {
    const api = engine.api;
    const alive = livingCellKeys(api);
    const key = `${originGx},${originGz}`;
    const occupied = alive.has(key);

    const armed = engine.context.capabilities.getOrUndefined<GolArmedPresetState>(
        ASTRIS_GOL_ARMED_PRESET_CAPABILITY,
    );
    if (armed?.presetId) {
        const cells: Array<readonly [number, number]> = [];
        for (const [gx, gz] of mapPresetCellsToWorld(armed.presetId, originGx, originGz)) {
            if (!alive.has(`${gx},${gz}`)) {
                cells.push([gx, gz]);
            }
        }
        return {
            active: cells.length > 0,
            originGx,
            originGz,
            kind: "preset",
            cells: cells.slice(0, HOVER_PREVIEW_MAX_CELLS),
        };
    }

    const tool = engine.context.capabilities.getOrUndefined<GolToolState>(ASTRIS_GOL_TOOL_CAPABILITY);
    const mode = tool?.mode ?? "paint";

    if (mode === "erase") {
        if (!occupied) {
            return { active: false, originGx, originGz, kind: "erase", cells: [] };
        }
        return {
            active: true,
            originGx,
            originGz,
            kind: "erase",
            cells: [[originGx, originGz]],
        };
    }

    if (occupied) {
        return {
            active: true,
            originGx,
            originGz,
            kind: "toggleRemove",
            cells: [[originGx, originGz]],
        };
    }

    return {
        active: true,
        originGx,
        originGz,
        kind: "place",
        cells: [[originGx, originGz]],
    };
}

export function updateGolHoverFromCell(
    engine: Engine,
    originGx: number,
    originGz: number,
): void {
    const hover = engine.context.capabilities.getOrUndefined<GolHoverState>(ASTRIS_GOL_HOVER_CAPABILITY);
    if (!hover) {
        return;
    }

    const result = computeHoverCells(engine, originGx, originGz);
    hover.active = result.active;
    hover.originGx = result.originGx;
    hover.originGz = result.originGz;
    hover.kind = result.kind;
}

export function clearGolHover(engine: Engine): void {
    const hover = engine.context.capabilities.getOrUndefined<GolHoverState>(ASTRIS_GOL_HOVER_CAPABILITY);
    if (hover) {
        clearHover(hover);
    }
}
