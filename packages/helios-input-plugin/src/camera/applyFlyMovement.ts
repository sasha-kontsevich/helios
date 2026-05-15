import * as THREE from "three";
import {
    FLY_LOOK_SENS,
    FLY_MAX_PITCH,
    FLY_MOVE_SPEED,
    FLY_SHIFT_SPEED_MULT,
} from "./flyConstants";

const tmpViewDir = new THREE.Vector3();
const tmpForward = new THREE.Vector3();
const tmpRight = new THREE.Vector3();
const tmpMove = new THREE.Vector3();
const tmpWorldUp = new THREE.Vector3(0, 1, 0);
const tmpEuler = new THREE.Euler();

export interface FlyPose {
    x: number;
    y: number;
    z: number;
    rotX: number;
    rotY: number;
    rotZ: number;
}

/** Apply RMB look deltas to euler YXZ rotation (matches editor fly). */
export function applyFlyLook(pose: FlyPose, lookDeltaX: number, lookDeltaY: number): void {
    if (lookDeltaX === 0 && lookDeltaY === 0) {
        return;
    }
    pose.rotY -= lookDeltaX * FLY_LOOK_SENS;
    pose.rotX -= lookDeltaY * FLY_LOOK_SENS;
    pose.rotX = THREE.MathUtils.clamp(pose.rotX, -FLY_MAX_PITCH, FLY_MAX_PITCH);
}

/**
 * Unity-style fly translation: W/S on XZ projection, Q/E vertical, A/D strafe.
 * Uses euler YXZ on `pose` (same convention as {@link Position} / {@link Rotation} + Three).
 */
export function applyFlyMovement(
    pose: FlyPose,
    keysDown: ReadonlySet<string>,
    shiftHeld: boolean,
    dt: number,
): void {
    if (keysDown.size === 0) {
        return;
    }

    const speedMult = shiftHeld ? FLY_SHIFT_SPEED_MULT : 1;
    const speed = FLY_MOVE_SPEED * dt * speedMult;
    tmpMove.set(0, 0, 0);

    tmpEuler.set(pose.rotX, pose.rotY, pose.rotZ, "YXZ");
    tmpViewDir.set(0, 0, -1).applyEuler(tmpEuler);

    tmpForward.copy(tmpViewDir);
    tmpForward.y = 0;
    if (tmpForward.lengthSq() < 1e-12) {
        tmpForward.set(-Math.sin(pose.rotY), 0, -Math.cos(pose.rotY));
    } else {
        tmpForward.normalize();
    }

    tmpRight.crossVectors(tmpForward, tmpWorldUp);
    if (tmpRight.lengthSq() < 1e-12) {
        tmpRight.set(1, 0, 0);
    } else {
        tmpRight.normalize();
    }

    if (keysDown.has("KeyW")) tmpMove.addScaledVector(tmpForward, speed);
    if (keysDown.has("KeyS")) tmpMove.addScaledVector(tmpForward, -speed);
    if (keysDown.has("KeyD")) tmpMove.addScaledVector(tmpRight, speed);
    if (keysDown.has("KeyA")) tmpMove.addScaledVector(tmpRight, -speed);
    if (keysDown.has("KeyE")) tmpMove.addScaledVector(tmpWorldUp, speed);
    if (keysDown.has("KeyQ")) tmpMove.addScaledVector(tmpWorldUp, -speed);

    pose.x += tmpMove.x;
    pose.y += tmpMove.y;
    pose.z += tmpMove.z;
}
