import { defineQuery } from "bitecs";
import { Name, System } from "@merlinn/helios-core";
import { LifeCell } from "../components";
import type { GridClickQueue } from "../game/GridClickQueue";
import { ASTRIS_GRID_CLICK_QUEUE_CAPABILITY } from "../game/gridInputCapabilities";
import { lifeCellComponentMap } from "../game/lifeCellPrefab";
import { ensureLifeCellsRootEid } from "../game/lifeCellsRoot";

/**
 * Applies queued grid clicks from {@link AstrisGridPointerSink}: click toggles; LMB drag places.
 */
export class GameOfLifePointerDrainSystem extends System {
    /** Grid clicks in the game view should work while editing (not only during Play). */
    static override readonly runsInEditor = true;

    private readonly nameQuery = defineQuery([Name]);
    private readonly cellQuery = defineQuery([LifeCell]);

    update(): void {
        const queue = this.context.capabilities.getOrUndefined<GridClickQueue>(ASTRIS_GRID_CLICK_QUEUE_CAPABILITY);
        if (!queue) {
            return;
        }
        const clicks = queue.drain();
        if (clicks.length === 0) {
            return;
        }

        const api = this.context.engine.api;
        const world = this.world;
        const cellsRootEid = ensureLifeCellsRootEid(api, world, this.nameQuery);

        for (const { gx, gz, mode } of clicks) {
            let existing: number | null = null;
            for (const eid of this.cellQuery(world)) {
                if (LifeCell.gx[eid] === gx && LifeCell.gz[eid] === gz) {
                    existing = eid;
                    break;
                }
            }
            if (mode === "place") {
                if (existing === null) {
                    api.createEntityFromComponents(lifeCellComponentMap(gx, gz, cellsRootEid));
                }
                continue;
            }
            if (existing !== null) {
                api.deleteEntity(existing);
                continue;
            }

            api.createEntityFromComponents(lifeCellComponentMap(gx, gz, cellsRootEid));
        }
    }
}
