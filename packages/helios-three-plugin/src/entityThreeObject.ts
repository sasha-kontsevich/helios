import * as THREE from "three";
import { ThreeObject } from "./components";
import {
    clearEntityPickingTag,
    HELIOS_ENTITY_EID_USERDATA_KEY,
    tagObject3DForEntityPicking,
} from "./picking/tagThreeObjectForPicking";

function detachThreeObject(object: THREE.Object3D): void {
    clearEntityPickingTag(object);
    object.removeFromParent();
}

/**
 * Remove scene objects tagged for `eid` except `keep` (orphans from prior ThreeObject resource ids).
 */
export function removeStaleTaggedObjectsForEntity(
    root: THREE.Object3D,
    eid: number,
    keep?: THREE.Object3D,
): void {
    const stale: THREE.Object3D[] = [];
    root.traverse((obj) => {
        if (obj === keep) return;
        const raw = (obj.userData as Record<string, unknown>)[HELIOS_ENTITY_EID_USERDATA_KEY];
        if (raw === eid) {
            stale.push(obj);
        }
    });
    for (const obj of stale) {
        detachThreeObject(obj);
    }
}

/** Replace the live {@link ThreeObject} for an entity, detaching any previous or stale meshes. */
export function setEntityThreeObject(
    root: THREE.Object3D,
    eid: number,
    next: THREE.Object3D,
): void {
    const comp = ThreeObject.get(eid);
    const prev = comp.object as THREE.Object3D | undefined;
    if (prev && prev !== next) {
        detachThreeObject(prev);
    }
    removeStaleTaggedObjectsForEntity(root, eid, next);
    comp.object = next;
    tagObject3DForEntityPicking(next, eid);
}
