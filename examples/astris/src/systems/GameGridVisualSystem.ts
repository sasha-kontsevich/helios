import { defineQuery } from "bitecs";
import { Name, System } from "@merlinn/helios-core";
import { gridLineAlongX, gridLineAlongZ, gridRootComponents } from "../game/gridVisualPrefab";

/** Half-size in cells (lines from -R..R inclusive on each axis). */
const GRID_HALF = 20;

const EXPECTED_GRID_LINE_COUNT = (GRID_HALF * 2 + 1) * 2;

function isGridLabel(label: string): boolean {
    return label === "Grid" || label === "GridLine";
}

/**
 * Spawns non-{@link LifeCell} decor meshes: thin boxes as a floor grid on Y≈0.
 * Re-spawns after {@link EngineAPI.applySceneSnapshot} / {@link EngineAPI.clearWorld} when grid entities are gone.
 */
export class GameGridVisualSystem extends System {
    /** Grid respawn after snapshot/clear must run outside Play. */
    static override readonly runsInEditor = true;

    private readonly nameQuery = defineQuery([Name]);

    private findGridRootEid(): number | null {
        for (const eid of this.nameQuery(this.world)) {
            if (Name.get(eid).label === "Grid") {
                return eid;
            }
        }
        return null;
    }

    private countGridLines(): number {
        let n = 0;
        for (const eid of this.nameQuery(this.world)) {
            if (Name.get(eid).label === "GridLine") {
                n++;
            }
        }
        return n;
    }

    private destroyGrid(): void {
        const api = this.context.engine.api;
        const toDelete: number[] = [];
        for (const eid of this.nameQuery(this.world)) {
            if (isGridLabel(Name.get(eid).label)) {
                toDelete.push(eid);
            }
        }
        for (const eid of toDelete) {
            api.deleteEntity(eid);
        }
    }

    private spawnGrid(): void {
        const api = this.context.engine.api;
        const rootEid = api.createEntityFromComponents(gridRootComponents());

        const h = GRID_HALF;
        for (let z = -h; z <= h; z++) {
            api.createEntityFromComponents(gridLineAlongX(h, z, rootEid));
        }
        for (let x = -h; x <= h; x++) {
            api.createEntityFromComponents(gridLineAlongZ(h, x, rootEid));
        }
    }

    /** Rebuild grid when missing or stale (e.g. after Play snapshot without grid group). */
    private ensureGrid(): void {
        const rootEid = this.findGridRootEid();
        const lineCount = this.countGridLines();
        if (rootEid !== null && lineCount === EXPECTED_GRID_LINE_COUNT) {
            return;
        }
        this.destroyGrid();
        this.spawnGrid();
    }

    async start(): Promise<void> {
        this.ensureGrid();
    }

    update(): void {
        this.ensureGrid();
    }
}
