import * as THREE from "three";

/** `Object3D.userData` key: ECS entity id for editor ray picking (see `pickEntityAtCanvasPoint` in helios-editor). */
export const HELIOS_ENTITY_EID_USERDATA_KEY = "heliosEntityEid" as const;

export function tagObject3DForEntityPicking(obj: THREE.Object3D, eid: number): void {
    (obj.userData as Record<string, unknown>)[HELIOS_ENTITY_EID_USERDATA_KEY] = eid;
}

export function clearEntityPickingTag(obj: THREE.Object3D | null | undefined): void {
    if (!obj) return;
    delete (obj.userData as Record<string, unknown>)[HELIOS_ENTITY_EID_USERDATA_KEY];
}

/** Walk parents until an object tagged with {@link HELIOS_ENTITY_EID_USERDATA_KEY} is found. */
export function resolvePickingEntityEidFromObject(obj: THREE.Object3D | null): number | null {
    let o: THREE.Object3D | null = obj;
    while (o) {
        const raw = (o.userData as Record<string, unknown>)[HELIOS_ENTITY_EID_USERDATA_KEY];
        if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
            return raw;
        }
        o = o.parent;
    }
    return null;
}
