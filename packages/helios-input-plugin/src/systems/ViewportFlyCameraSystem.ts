import { defineQuery } from "bitecs";
import { Position, Rotation, System } from "@merlinn/helios-core";
import { ViewportCameraControl } from "../components/ViewportCameraControl";
import { applyFlyLook, applyFlyMovement } from "../camera/applyFlyMovement";
import { getViewportInput } from "../getViewportInput";

export class ViewportFlyCameraSystem extends System {
    static override readonly runsInEditor = true;

    private readonly query = defineQuery([ViewportCameraControl, Position, Rotation]);

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
            const pose = {
                x: Position.x[eid],
                y: Position.y[eid],
                z: Position.z[eid],
                rotX: Rotation.x[eid],
                rotY: Rotation.y[eid],
                rotZ: Rotation.z[eid],
            };

            if (input.flyActive) {
                applyFlyLook(pose, input.lookDeltaX, input.lookDeltaY);
                applyFlyMovement(pose, input.keysDown, input.shiftHeld, dt);
            }

            Position.x[eid] = pose.x;
            Position.y[eid] = pose.y;
            Position.z[eid] = pose.z;
            Rotation.x[eid] = pose.rotX;
            Rotation.y[eid] = pose.rotY;
            Rotation.z[eid] = pose.rotZ;
        }

        input.beginFrame();
    }
}
