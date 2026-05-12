import type { EngineAPI } from "@merlinn/helios-core";
import type { Object3D } from "three";

/**
 * Copies local `position` / `rotation` (Euler) / `scale` from a `THREE.Object3D` into ECS
 * {@link Position}, {@link Rotation}, {@link Scale} via {@link EngineAPI.applyComponentPatch},
 * adding missing transform components first.
 *
 * Component names match `helios-core` defaults; hosts with a custom `ComponentMap` should register
 * equivalent transform components.
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
    const r = object.rotation;
    const s = object.scale;
    api.applyComponentPatch(eid, "Position" as never, { x: p.x, y: p.y, z: p.z });
    api.applyComponentPatch(eid, "Rotation" as never, { x: r.x, y: r.y, z: r.z });
    api.applyComponentPatch(eid, "Scale" as never, { x: s.x, y: s.y, z: s.z });
}
