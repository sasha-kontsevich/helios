import {
    Position,
    quatFromYawPitch,
    Rotation,
    System,
    type Quat,
} from "@merlinn/helios-core";
import {
    clearViewportInputFrame,
    getViewportInputEntity,
    ViewportInput,
    ViewportInputButton,
    ViewportInputKey,
} from "@merlinn/helios-input-plugin";
import { ThreeCamera } from "@merlinn/helios-three-plugin";
import { defineQuery } from "bitecs";
import { AstrisFlyCamera } from "../components";

const DEFAULT_MOVE_SPEED = 6;
const DEFAULT_FAST_MULTIPLIER = 3;
const DEFAULT_LOOK_SENSITIVITY = 0.0025;
const MAX_PITCH = Math.PI / 2 - 0.02;

function hasFlag(value: number, flag: number): boolean {
    return (value & flag) !== 0;
}

function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
}

function forwardFromQuat(q: Quat): { x: number; y: number; z: number } {
    return {
        x: -2 * (q.x * q.z + q.w * q.y),
        y: 2 * (q.w * q.x - q.y * q.z),
        z: -1 + 2 * (q.x * q.x + q.y * q.y),
    };
}

export class AstrisFlyCameraSystem extends System {
    static override readonly runsInEditor = true;

    private readonly query = defineQuery([AstrisFlyCamera, Position, Rotation, ThreeCamera]);

    update(dt: number): void {
        const inputEid = getViewportInputEntity(this.context);
        if (inputEid === null) {
            return;
        }

        const enabled = ViewportInput.enabled[inputEid] !== 0;
        const keys = ViewportInput.keys[inputEid];
        const buttons = ViewportInput.buttons[inputEid];
        const rightMouse = hasFlag(buttons, ViewportInputButton.Right);

        for (const eid of this.query(this.world)) {
            this.ensureInitialized(eid);
            if (!enabled || !rightMouse) {
                continue;
            }

            const sensitivity = AstrisFlyCamera.lookSensitivity[eid] || DEFAULT_LOOK_SENSITIVITY;
            AstrisFlyCamera.yaw[eid] -= ViewportInput.lookDeltaX[inputEid] * sensitivity;
            AstrisFlyCamera.pitch[eid] = clamp(
                AstrisFlyCamera.pitch[eid] - ViewportInput.lookDeltaY[inputEid] * sensitivity,
                -MAX_PITCH,
                MAX_PITCH,
            );

            this.applyMovement(eid, keys, dt);
            this.writeRotation(eid);
        }

        clearViewportInputFrame(inputEid);
    }

    private ensureInitialized(eid: number): void {
        if (AstrisFlyCamera.initialized[eid] !== 0) {
            return;
        }

        const forward = forwardFromQuat({
            x: Rotation.x[eid],
            y: Rotation.y[eid],
            z: Rotation.z[eid],
            w: Rotation.w[eid],
        });
        AstrisFlyCamera.yaw[eid] = Math.atan2(-forward.x, -forward.z);
        AstrisFlyCamera.pitch[eid] = clamp(Math.asin(clamp(forward.y, -1, 1)), -MAX_PITCH, MAX_PITCH);
        if (AstrisFlyCamera.moveSpeed[eid] <= 0) {
            AstrisFlyCamera.moveSpeed[eid] = DEFAULT_MOVE_SPEED;
        }
        if (AstrisFlyCamera.fastMultiplier[eid] <= 0) {
            AstrisFlyCamera.fastMultiplier[eid] = DEFAULT_FAST_MULTIPLIER;
        }
        if (AstrisFlyCamera.lookSensitivity[eid] <= 0) {
            AstrisFlyCamera.lookSensitivity[eid] = DEFAULT_LOOK_SENSITIVITY;
        }
        AstrisFlyCamera.initialized[eid] = 1;
        this.writeRotation(eid);
    }

    private applyMovement(eid: number, keys: number, dt: number): void {
        const speed =
            AstrisFlyCamera.moveSpeed[eid] *
            (hasFlag(keys, ViewportInputKey.Shift) ? AstrisFlyCamera.fastMultiplier[eid] : 1) *
            dt;
        const yaw = AstrisFlyCamera.yaw[eid];
        const forwardX = -Math.sin(yaw);
        const forwardZ = -Math.cos(yaw);
        const rightX = Math.cos(yaw);
        const rightZ = -Math.sin(yaw);

        if (hasFlag(keys, ViewportInputKey.W)) {
            Position.x[eid] += forwardX * speed;
            Position.z[eid] += forwardZ * speed;
        }
        if (hasFlag(keys, ViewportInputKey.S)) {
            Position.x[eid] -= forwardX * speed;
            Position.z[eid] -= forwardZ * speed;
        }
        if (hasFlag(keys, ViewportInputKey.D)) {
            Position.x[eid] += rightX * speed;
            Position.z[eid] += rightZ * speed;
        }
        if (hasFlag(keys, ViewportInputKey.A)) {
            Position.x[eid] -= rightX * speed;
            Position.z[eid] -= rightZ * speed;
        }
        if (hasFlag(keys, ViewportInputKey.E)) {
            Position.y[eid] += speed;
        }
        if (hasFlag(keys, ViewportInputKey.Q)) {
            Position.y[eid] -= speed;
        }
    }

    private writeRotation(eid: number): void {
        const q = quatFromYawPitch(AstrisFlyCamera.yaw[eid], AstrisFlyCamera.pitch[eid]);
        Rotation.x[eid] = q.x;
        Rotation.y[eid] = q.y;
        Rotation.z[eid] = q.z;
        Rotation.w[eid] = q.w;
    }
}
