import type { EngineAPI } from "@merlinn/helios-core";
import type { Object3D } from "three";
import { setRotationEulerHintFromQuat } from "../inspector/rotationEulerHintStore";

/**
 * Copies local transform from a `THREE.Object3D` into ECS
 * {@link Position}, {@link Rotation} (quaternion), {@link Scale}.
 */
export function writeEcsTransformFromObject3D(api: EngineAPI, eid: number, object: Object3D): void {
    if (!api.entityExists(eid)) {
        return;
    }
    const ensure = (name: "Position" | "Rotation" | "Scale"): void => {
        if (!api.hasComponent(eid, name as never)) {
            api.addComponent(eid, name as never);
        }
    };
    ensure("Position");
    ensure("Rotation");
    ensure("Scale");
    const p = object.position;
    const q = object.quaternion;
    const s = object.scale;
    setRotationEulerHintFromQuat(eid, { x: q.x, y: q.y, z: q.z, w: q.w });
    api.applyComponentPatch(eid, "Position" as never, { x: p.x, y: p.y, z: p.z });
    api.applyComponentPatch(eid, "Rotation" as never, { x: q.x, y: q.y, z: q.z, w: q.w });
    api.applyComponentPatch(eid, "Scale" as never, { x: s.x, y: s.y, z: s.z });
}
