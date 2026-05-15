import { Position, Rotation } from "@merlinn/helios-core";
import * as THREE from "three";

export function syncCameraPoseToEcs(eid: number, camera: THREE.PerspectiveCamera): void {
    Position.x[eid] = camera.position.x;
    Position.y[eid] = camera.position.y;
    Position.z[eid] = camera.position.z;
    Rotation.x[eid] = camera.quaternion.x;
    Rotation.y[eid] = camera.quaternion.y;
    Rotation.z[eid] = camera.quaternion.z;
    Rotation.w[eid] = camera.quaternion.w;
}
