import { defineQuery } from "bitecs";
import { Position, Rotation, System } from "@merlinn/helios-core";
import { ThreeObject } from "@merlinn/helios-three-plugin";
import * as THREE from "three";
import { ViewportCameraControl } from "../components/ViewportCameraControl";
import { applyFlyLookOnCamera, applyFlyMoveOnCamera } from "../camera/flyCameraThree";
import { syncCameraPoseToEcs } from "../camera/syncCameraPose";
import { getViewportInput } from "../getViewportInput";

export class ViewportFlyCameraSystem extends System {
    static override readonly runsInEditor = true;

    private readonly query = defineQuery([ViewportCameraControl, Position, Rotation, ThreeObject]);

    update(dt: number): void {
        const input = getViewportInput(this.context);

        if (!input.enabled) {
            input.beginFrame();
            return;
        }

        const hasFlyInput =
            input.flyActive &&
            (input.lookDeltaX !== 0 ||
                input.lookDeltaY !== 0 ||
                input.keysDown.size > 0);

        if (!hasFlyInput) {
            input.beginFrame();
            return;
        }

        for (const eid of this.query(this.world)) {
            const object = ThreeObject.get(eid).object;
            if (!(object instanceof THREE.PerspectiveCamera)) {
                continue;
            }

            if (input.flyActive) {
                applyFlyLookOnCamera(object, input.lookDeltaX, input.lookDeltaY);
                applyFlyMoveOnCamera(object, input.keysDown, input.shiftHeld, dt);
                syncCameraPoseToEcs(eid, object);
            }
        }

        input.beginFrame();
    }
}
