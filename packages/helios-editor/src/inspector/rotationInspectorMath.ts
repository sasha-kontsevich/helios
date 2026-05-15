import type { Quat } from "@merlinn/helios-core";
import * as THREE from "three";

/**
 * Inspector euler order: Three.js default (XYZ), same as legacy scene JSON spawn.
 * Unity uses degrees too but ZXY order; we keep XYZ so edited values match the renderer.
 */
const EULER_ORDER: THREE.EulerOrder = "XYZ";

const tmpEuler = new THREE.Euler();
const tmpQuat = new THREE.Quaternion();

/** Unity-style display range for euler degrees. */
export function normalizeEulerDegrees(degrees: number): number {
    let d = degrees % 360;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
}

export function eulerDegreesFromRotationQuat(q: Quat): { x: number; y: number; z: number } {
    tmpQuat.set(q.x, q.y, q.z, q.w);
    tmpEuler.setFromQuaternion(tmpQuat, EULER_ORDER);
    return {
        x: normalizeEulerDegrees((tmpEuler.x * 180) / Math.PI),
        y: normalizeEulerDegrees((tmpEuler.y * 180) / Math.PI),
        z: normalizeEulerDegrees((tmpEuler.z * 180) / Math.PI),
    };
}

export function rotationQuatFromEulerDegrees(xDeg: number, yDeg: number, zDeg: number): Quat {
    tmpEuler.set((xDeg * Math.PI) / 180, (yDeg * Math.PI) / 180, (zDeg * Math.PI) / 180, EULER_ORDER);
    tmpQuat.setFromEuler(tmpEuler);
    return { x: tmpQuat.x, y: tmpQuat.y, z: tmpQuat.z, w: tmpQuat.w };
}
