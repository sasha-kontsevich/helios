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

function clearHover(hover: GolHoverState): void {
    hover.active = false;
    hover.cells = [];
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
        hover.active = cells.length > 0;
        hover.originGx = originGx;
        hover.originGz = originGz;
        hover.cells = cells;
        hover.kind = "preset";
        return;
    }

    const tool = engine.context.capabilities.getOrUndefined<GolToolState>(ASTRIS_GOL_TOOL_CAPABILITY);
    const mode = tool?.mode ?? "paint";

    if (mode === "erase") {
        if (!occupied) {
            clearHover(hover);
            return;
        }
        hover.active = true;
        hover.originGx = originGx;
        hover.originGz = originGz;
        hover.cells = [[originGx, originGz]];
        hover.kind = "erase";
        return;
    }

    if (occupied) {
        hover.active = true;
        hover.originGx = originGx;
        hover.originGz = originGz;
        hover.cells = [[originGx, originGz]];
        hover.kind = "toggleRemove";
        return;
    }

    hover.active = true;
    hover.originGx = originGx;
    hover.originGz = originGz;
    hover.cells = [[originGx, originGz]];
    hover.kind = "place";
}

export function clearGolHover(engine: Engine): void {
    const hover = engine.context.capabilities.getOrUndefined<GolHoverState>(ASTRIS_GOL_HOVER_CAPABILITY);
    if (hover) {
        clearHover(hover);
    }
}
