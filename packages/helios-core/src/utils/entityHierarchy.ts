import type { EntitySnapshot } from "../types/EntitySnapshot";

export interface HierarchyNode {
    eid: number;
    snapshot: EntitySnapshot;
    children: HierarchyNode[];
}

export function getEntityParentEidFromSnapshot(snap: EntitySnapshot): number | null {
    const parent = snap.components.Parent;
    if (!parent) {
        return null;
    }
    const target = parent.target;
    if (typeof target !== "number" || target <= 0) {
        return null;
    }
    return target;
}

function sortEntitySnapshots(list: EntitySnapshot[]): EntitySnapshot[] {
    return [...list].sort((a, b) => {
        const na = typeof a.components.Name?.label === "string" ? a.components.Name.label : "";
        const nb = typeof b.components.Name?.label === "string" ? b.components.Name.label : "";
        if (na !== nb) {
            return na.localeCompare(nb);
        }
        return a.eid - b.eid;
    });
}

export function getEntityChildren(parentEid: number, entities: EntitySnapshot[]): EntitySnapshot[] {
    return sortEntitySnapshots(
        entities.filter((ent) => getEntityParentEidFromSnapshot(ent) === parentEid),
    );
}

export function buildEntityHierarchyTree(entities: EntitySnapshot[]): HierarchyNode[] {
    const byEid = new Map(entities.map((ent) => [ent.eid, ent]));
    const childrenOf = new Map<number, EntitySnapshot[]>();

    for (const ent of entities) {
        const parentEid = getEntityParentEidFromSnapshot(ent);
        if (parentEid !== null && byEid.has(parentEid)) {
            const bucket = childrenOf.get(parentEid) ?? [];
            bucket.push(ent);
            childrenOf.set(parentEid, bucket);
        }
    }

    const roots = entities.filter((ent) => {
        const parentEid = getEntityParentEidFromSnapshot(ent);
        return parentEid === null || !byEid.has(parentEid);
    });

    function buildNode(snap: EntitySnapshot): HierarchyNode {
        const kids = sortEntitySnapshots(childrenOf.get(snap.eid) ?? []);
        return {
            eid: snap.eid,
            snapshot: snap,
            children: kids.map(buildNode),
        };
    }

    return sortEntitySnapshots(roots).map(buildNode);
}

/** True when `descendantEid` is in the subtree rooted at `ancestorEid`. */
export function isEntityDescendantOf(
    ancestorEid: number,
    descendantEid: number,
    entities: EntitySnapshot[],
): boolean {
    if (ancestorEid === descendantEid) {
        return true;
    }
    const parentOf = new Map<number, number>();
    for (const ent of entities) {
        const parentEid = getEntityParentEidFromSnapshot(ent);
        if (parentEid !== null) {
            parentOf.set(ent.eid, parentEid);
        }
    }
    let current: number | undefined = descendantEid;
    while (current !== undefined) {
        const parent = parentOf.get(current);
        if (parent === undefined) {
            return false;
        }
        if (parent === ancestorEid) {
            return true;
        }
        current = parent;
    }
    return false;
}
