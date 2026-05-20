import type { EngineAPI } from "@merlinn/helios-core";
import type { GolStatsState } from "./astrisCapabilities";

export function clearAllLifeCells(api: EngineAPI, stats?: GolStatsState): number {
    const toDelete = api
        .getAllEntities()
        .filter((snap) => Object.prototype.hasOwnProperty.call(snap.components, "LifeCell"));
    for (const snap of toDelete) {
        api.deleteEntity(snap.eid);
    }
    if (stats) {
        stats.generation = 0;
        stats.aliveCount = 0;
    }
    return toDelete.length;
}
