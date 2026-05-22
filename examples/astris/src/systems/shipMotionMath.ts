import { normalizeQuat, quatFromEulerXYZ, Rotation, type Quat } from "@merlinn/helios-core";
import { addComponent, hasComponent } from "bitecs";

/** Orbit/sway need {@link Rotation}; model wrappers often spawn without it. */
export function ensureRotationComponent(world: object, eid: number): void {
    const w = world as Parameters<typeof hasComponent>[0];
    if (!hasComponent(w, Rotation, eid)) {
        addComponent(w, Rotation, eid);
        Rotation.x[eid] = 0;
        Rotation.y[eid] = 0;
        Rotation.z[eid] = 0;
        Rotation.w[eid] = 1;
    }
}

export function quatMultiply(a: Quat, b: Quat): Quat {
    return normalizeQuat({
        x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
        y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
        z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
        w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    });
}

function quatConjugate(q: Quat): Quat {
    return { x: -q.x, y: -q.y, z: -q.z, w: q.w };
}

function quatRotateVector(q: Quat, v: { x: number; y: number; z: number }): {
    x: number;
    y: number;
    z: number;
} {
    const { x, y, z, w } = q;
    const ix = w * v.x + y * v.z - z * v.y;
    const iy = w * v.y + z * v.x - x * v.z;
    const iz = w * v.z + x * v.y - y * v.x;
    const iw = -x * v.x - y * v.y - z * v.z;
    return {
        x: ix * w + iw * -x + iy * -z - iz * -y,
        y: iy * w + iw * -y + iz * -x - ix * -z,
        z: iz * w + iw * -z + ix * -y - iy * -x,
    };
}

/** Signed local-X roll so the ship banks toward a horizontal world direction. */
export function inwardBankRoll(
    base: Quat,
    inwardX: number,
    inwardZ: number,
    amount: number,
): number {
    if (amount === 0) {
        return 0;
    }
    const local = quatRotateVector(
        quatConjugate(normalizeQuat(base)),
        { x: inwardX, y: 0, z: inwardZ },
    );
    if (Math.abs(local.x) < 1e-4) {
        return 0;
    }
    return amount * Math.sign(local.x);
}

/** Steady bank toward orbit center + oscillating roll/pitch on top of yaw. */
export function applyBankAndSwayToQuat(
    base: Quat,
    inwardX: number,
    inwardZ: number,
    bankTowardCenter: number,
    rollAmp: number,
    pitchAmp: number,
    t: number,
): Quat {
    const bankRoll = inwardBankRoll(base, inwardX, inwardZ, bankTowardCenter);
    const swayRoll = rollAmp * Math.sin(t);
    const pitch = pitchAmp * Math.cos(t * 0.87 + 0.4);
    const sway = quatFromEulerXYZ(bankRoll + swayRoll, 0, pitch);
    return quatMultiply(base, sway);
}

/** Small roll (X) and pitch (Z in XYZ euler order for ship sway) on top of a base orientation. */
export function applySwayToQuat(base: Quat, rollAmp: number, pitchAmp: number, t: number): Quat {
    return applyBankAndSwayToQuat(base, 0, 0, 0, rollAmp, pitchAmp, t);
}
