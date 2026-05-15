import { defineQuery } from "bitecs";
import { Name, System } from "@merlinn/helios-core";
import { gridLineAlongX, gridLineAlongZ } from "../game/gridVisualPrefab";

/** Half-size in cells (lines from -R..R inclusive on each axis). */
const GRID_HALF = 20;

/**
 * Spawns non-{@link LifeCell} decor meshes: thin boxes as a floor grid on Y≈0.
 * Re-spawns after {@link EngineAPI.applySceneSnapshot} / {@link EngineAPI.clearWorld} when grid entities are gone.
 */
export class GameGridVisualSystem extends System {
    /** Grid respawn after snapshot/clear must run outside Play. */
    static override readonly runsInEditor = true;

    private readonly nameQuery = defineQuery([Name]);
    private countGridEntities(): number {
        let n = 0;
        for (const eid of this.nameQuery(this.world)) {
            if (Name.get(eid).label === "Grid") {
                n++;
            }
        }
        return n;
    }

    private spawnGrid(): void {
        if (this.countGridEntities() !== 0) {
            return;
        }
        const api = this.context.engine.api;
        const h = GRID_HALF;
        for (let z = -h; z <= h; z++) {
            api.createEntityFromComponents(gridLineAlongX(h, z));
        }
        for (let x = -h; x <= h; x++) {
            api.createEntityFromComponents(gridLineAlongZ(h, x));
        }
    }

    async start(): Promise<void> {
        this.spawnGrid();
    }

    update(): void {
        if (this.countGridEntities() === 0) {
            this.spawnGrid();
        }
    }
}
