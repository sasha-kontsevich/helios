import { defineQuery } from "bitecs";
import { Name, System } from "@merlinn/helios-core";
import { LifeCellPreview } from "../components";
import { ensureLifeCellsPreviewRootEid } from "../game/lifeCellsPreviewRoot";

/**
 * Parents every {@link LifeCellPreview} under {@link LIFE_CELLS_PREVIEW_ROOT_LABEL}.
 */
export class LifeCellsPreviewHierarchySystem extends System {
    static override readonly systemName = "LifeCellsPreviewHierarchySystem";
    static override readonly systemDescription =
        "Parents LifeCellPreview under the preview root.";
    static override readonly runsInEditor = true;

    private readonly nameQuery = defineQuery([Name]);
    private readonly previewQuery = defineQuery([LifeCellPreview]);

    update(): void {
        const api = this.context.engine.api;
        const rootEid = ensureLifeCellsPreviewRootEid(api, this.world, this.nameQuery);

        for (const eid of this.previewQuery(this.world)) {
            if (api.getEntityParentEid(eid) !== rootEid) {
                api.setEntityParent(eid, rootEid);
            }
        }
    }
}
