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
const tmpEuler = new THREE.Euler(0, 0, 0, "YXZ");
const tmpPitchQuat = new THREE.Quaternion();
const tmpYawQuat = new THREE.Quaternion();

/**
 * Fly look via quaternion (yaw around world Y, pitch around camera right).
 * Keeps {@link Rotation} ECS values consistent with inspector euler XYZ display.
 */
export function applyFlyLookOnCamera(
    camera: THREE.PerspectiveCamera,
    lookDeltaX: number,
    lookDeltaY: number,
): void {
    if (lookDeltaX === 0 && lookDeltaY === 0) {
        return;
    }

    if (lookDeltaX !== 0) {
        tmpYawQuat.setFromAxisAngle(tmpWorldUp, -lookDeltaX * FLY_LOOK_SENS);
        camera.quaternion.premultiply(tmpYawQuat);
    }

    if (lookDeltaY !== 0) {
        tmpRight.set(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
        tmpPitchQuat.setFromAxisAngle(tmpRight, -lookDeltaY * FLY_LOOK_SENS);
        camera.quaternion.multiply(tmpPitchQuat);
    }

    tmpEuler.setFromQuaternion(camera.quaternion, "YXZ");
    tmpEuler.x = THREE.MathUtils.clamp(tmpEuler.x, -FLY_MAX_PITCH, FLY_MAX_PITCH);
    camera.quaternion.setFromEuler(tmpEuler);
}

/** Match {@link EditorSceneView.applyFlyMove}. */
export function applyFlyMoveOnCamera(
    camera: THREE.PerspectiveCamera,
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

    camera.getWorldDirection(tmpViewDir);

    tmpForward.copy(tmpViewDir);
    tmpForward.y = 0;
    if (tmpForward.lengthSq() < 1e-12) {
        tmpEuler.setFromQuaternion(camera.quaternion, "YXZ");
        tmpForward.set(-Math.sin(tmpEuler.y), 0, -Math.cos(tmpEuler.y));
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

    camera.position.add(tmpMove);
}
