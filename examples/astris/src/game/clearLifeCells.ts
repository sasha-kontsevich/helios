import type { Engine } from "@merlinn/helios-core";
import type { EngineAPI } from "@merlinn/helios-core";
import { ASTRIS_GOL_CELL_INDEX_CAPABILITY, type GolStatsState } from "./astrisCapabilities";
import type { GolAliveCellIndex } from "./golCellIndex";

export function clearAllLifeCells(
    api: EngineAPI,
    stats?: GolStatsState,
    engine?: Engine,
): number {
    const toDelete = api
        .getAllEntities()
        .filter((snap) => Object.prototype.hasOwnProperty.call(snap.components, "LifeCell"));
    for (const snap of toDelete) {
        api.deleteEntity(snap.eid);
    }
    const index =
        engine?.context.capabilities.getOrUndefined<GolAliveCellIndex>(
            ASTRIS_GOL_CELL_INDEX_CAPABILITY,
        ) ??
        undefined;
    index?.clear();
    if (stats) {
        stats.generation = 0;
        stats.aliveCount = 0;
    }
    return toDelete.length;
}
