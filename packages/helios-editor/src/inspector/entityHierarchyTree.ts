import {
    buildEntityHierarchyTree,
    isEntityDescendantOf,
    type EntitySnapshot,
    type HierarchyNode,
} from "@merlinn/helios-core";
import { entityNameOnly } from "../utils/entityDisplayLabel";

export type { HierarchyNode };

export function buildEditorEntityHierarchy(entities: EntitySnapshot[]): HierarchyNode[] {
    return buildEntityHierarchyTree(entities);
}

export function hierarchyNodeLabel(node: HierarchyNode): string {
    const name = entityNameOnly(node.snapshot);
    if (name) {
        return name;
    }
    return `Entity ${node.eid}`;
}

export function canReparentEntity(
    draggedEid: number,
    dropTargetEid: number | null,
    entities: EntitySnapshot[],
): boolean {
    if (dropTargetEid !== null && draggedEid === dropTargetEid) {
        return false;
    }
    if (dropTargetEid !== null && isEntityDescendantOf(draggedEid, dropTargetEid, entities)) {
        return false;
    }
    return true;
}
