import type { IWorld } from "bitecs";
import { Name } from "@merlinn/helios-core";
import type { EngineAPI } from "@merlinn/helios-core";

/** {@link Name.label} for the parent of all {@link LifeCellPreview} entities. */
export const LIFE_CELLS_PREVIEW_ROOT_LABEL = "LifeCellsPreview";

export function lifeCellsPreviewRootComponents(): Record<string, Record<string, unknown>> {
    return {
        Name: { label: LIFE_CELLS_PREVIEW_ROOT_LABEL },
        ThreeObject: {},
    };
}

export function findLifeCellsPreviewRootEid(
    world: IWorld,
    nameQuery: (world: IWorld) => Iterable<number>,
): number | null {
    for (const eid of nameQuery(world)) {
        if (Name.get(eid).label === LIFE_CELLS_PREVIEW_ROOT_LABEL) {
            return eid;
        }
    }
    return null;
}

export function ensureLifeCellsPreviewRootEid(
    api: EngineAPI,
    world: IWorld,
    nameQuery: (world: IWorld) => Iterable<number>,
): number {
    const existing = findLifeCellsPreviewRootEid(world, nameQuery);
    if (existing !== null) {
        return existing;
    }

    const rootEid = api.createEntityFromComponents(lifeCellsPreviewRootComponents());
    let sceneRootEid: number | null = null;
    for (const eid of nameQuery(world)) {
        if (Name.get(eid).label === "Сцена") {
            sceneRootEid = eid;
            break;
        }
    }
    if (sceneRootEid !== null) {
        api.setEntityParent(rootEid, sceneRootEid);
    }
    return rootEid;
}

function entityLabel(snap: { components: Record<string, Record<string, unknown>> }): string | undefined {
    const name = snap.components.Name as { label?: string } | undefined;
    return name?.label;
}

export function findLifeCellsPreviewRootEidFromApi(api: EngineAPI): number | null {
    for (const snap of api.getAllEntities()) {
        if (entityLabel(snap) === LIFE_CELLS_PREVIEW_ROOT_LABEL) {
            return snap.eid;
        }
    }
    return null;
}

export function ensureLifeCellsPreviewRootEidFromApi(api: EngineAPI): number {
    const existing = findLifeCellsPreviewRootEidFromApi(api);
    if (existing !== null) {
        return existing;
    }
    const rootEid = api.createEntityFromComponents(lifeCellsPreviewRootComponents());
    let sceneRootEid: number | null = null;
    for (const snap of api.getAllEntities()) {
        if (entityLabel(snap) === "Сцена") {
            sceneRootEid = snap.eid;
            break;
        }
    }
    if (sceneRootEid !== null) {
        api.setEntityParent(rootEid, sceneRootEid);
    }
    return rootEid;
}
