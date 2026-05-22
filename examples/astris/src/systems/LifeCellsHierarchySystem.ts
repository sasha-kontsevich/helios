import { defineQuery } from "bitecs";
import { Name, System } from "@merlinn/helios-core";
import { LifeCell } from "../components";
import { ensureLifeCellsRootEid } from "../game/lifeCellsRoot";

/**
 * Keeps an empty {@link LIFE_CELLS_ROOT_LABEL} group in the scene and parents every {@link LifeCell} under it.
 */
export class LifeCellsHierarchySystem extends System {
    static override readonly systemName = "LifeCellsHierarchySystem";
    static override readonly systemDescription =
        "Группирует сущности LifeCell под корнем LifeCells.";
    static override readonly runsInEditor = true;

    private readonly nameQuery = defineQuery([Name]);
    private readonly cellQuery = defineQuery([LifeCell]);

    update(): void {
        const api = this.context.engine.api;
        const rootEid = ensureLifeCellsRootEid(api, this.world, this.nameQuery);

        for (const eid of this.cellQuery(this.world)) {
            if (api.getEntityParentEid(eid) !== rootEid) {
                api.setEntityParent(eid, rootEid);
            }
        }
    }
}
