import { defineQuery } from "bitecs";
import { System } from "@merlinn/helios-core";
import { LifeCell } from "../components";
import type { GridClickQueue } from "../game/GridClickQueue";
import { ASTRIS_GRID_CLICK_QUEUE_CAPABILITY } from "../game/gridInputCapabilities";
import { lifeCellComponentMap } from "../game/lifeCellPrefab";

/**
 * Applies queued grid clicks from {@link AstrisGridPointerSink}: toggle one cube per cell.
 */
export class GameOfLifePointerDrainSystem extends System {
    /** Grid clicks in the game view should work while editing (not only during Play). */
    static override readonly runsInEditor = true;

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

        for (const { gx, gz } of clicks) {
            let existing: number | null = null;
            for (const eid of this.cellQuery(world)) {
                if (LifeCell.gx[eid] === gx && LifeCell.gz[eid] === gz) {
                    existing = eid;
                    break;
                }
            }
            if (existing !== null) {
                api.deleteEntity(existing);
                continue;
            }

            api.createEntityFromComponents(lifeCellComponentMap(gx, gz));
        }
    }
}
