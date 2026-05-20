import { defineQuery } from "bitecs";
import type { EngineAPI } from "@merlinn/helios-core";
import { Name, System } from "@merlinn/helios-core";
import { LifeCellPreview } from "../components";
import {
    ASTRIS_GOL_HOVER_CAPABILITY,
    type GolHoverPreviewKind,
    type GolHoverState,
} from "../game/astrisCapabilities";
import { computeHoverCells } from "../game/golHoverLogic";
import { lifeCellPreviewComponentMap } from "../game/lifeCellPreviewPrefab";
import { ensureLifeCellsPreviewRootEid } from "../game/lifeCellsPreviewRoot";

function cellKey(gx: number, gz: number): string {
    return `${gx},${gz}`;
}

/**
 * Syncs {@link LifeCellPreview} ECS entities to {@link ASTRIS_GOL_HOVER_CAPABILITY} intent.
 */
export class GolHoverSyncSystem extends System {
    static override readonly runsInEditor = true;

    private readonly nameQuery = defineQuery([Name]);
    private readonly previewQuery = defineQuery([LifeCellPreview]);
    private lastSyncedKind: GolHoverPreviewKind | null = null;

    update(): void {
        const api = this.context.engine.api;
        const engine = this.context.engine;
        const hover = this.context.capabilities.getOrUndefined<GolHoverState>(ASTRIS_GOL_HOVER_CAPABILITY);

        if (!hover?.active) {
            this.lastSyncedKind = null;
            this.deleteAllPreview(api);
            return;
        }

        const desired = computeHoverCells(engine, hover.originGx, hover.originGz);
        if (!desired.active || desired.cells.length === 0) {
            this.lastSyncedKind = null;
            this.deleteAllPreview(api);
            return;
        }

        const kind = desired.kind;
        const previewRootEid = ensureLifeCellsPreviewRootEid(api, this.world, this.nameQuery);

        const current = new Map<string, number>();
        for (const eid of this.previewQuery(this.world)) {
            current.set(cellKey(LifeCellPreview.gx[eid], LifeCellPreview.gz[eid]), eid);
        }

        const desiredKeys = new Set<string>();
        for (const [gx, gz] of desired.cells) {
            desiredKeys.add(cellKey(gx, gz));
        }

        const kindChanged = this.lastSyncedKind !== null && this.lastSyncedKind !== kind;
        if (kindChanged) {
            this.deleteAllPreview(api);
            current.clear();
        } else {
            for (const [key, eid] of current) {
                if (!desiredKeys.has(key)) {
                    api.deleteEntity(eid);
                    current.delete(key);
                }
            }
        }

        for (const [gx, gz] of desired.cells) {
            const key = cellKey(gx, gz);
            if (!current.has(key)) {
                api.createEntityFromComponents(
                    lifeCellPreviewComponentMap(gx, gz, previewRootEid, kind),
                );
            }
        }

        this.lastSyncedKind = kind;
    }

    private deleteAllPreview(api: EngineAPI): void {
        for (const eid of [...this.previewQuery(this.world)]) {
            api.deleteEntity(eid);
        }
    }
}
