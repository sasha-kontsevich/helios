/** Euler order used when converting {@link Rotation} for editor display and legacy scene JSON. */
export const EULER_DISPLAY_ORDER = "XYZ" as const;

export interface Quat {
    x: number;
    y: number;
    z: number;
    w: number;
}

export interface EulerXYZ {
    x: number;
    y: number;
    z: number;
}

export function normalizeQuat(q: Quat): Quat {
    const len = Math.hypot(q.x, q.y, q.z, q.w);
    if (len < 1e-12) {
        return { x: 0, y: 0, z: 0, w: 1 };
    }
    const inv = 1 / len;
    return { x: q.x * inv, y: q.y * inv, z: q.z * inv, w: q.w * inv };
}

/** Build unit quaternion from intrinsic Euler angles in XYZ order (Three.js default). */
export function quatFromEulerXYZ(ex: number, ey: number, ez: number): Quat {
    const c1 = Math.cos(ex / 2);
    const s1 = Math.sin(ex / 2);
    const c2 = Math.cos(ey / 2);
    const s2 = Math.sin(ey / 2);
    const c3 = Math.cos(ez / 2);
    const s3 = Math.sin(ez / 2);

    return normalizeQuat({
        x: s1 * c2 * c3 + c1 * s2 * s3,
        y: c1 * s2 * c3 - s1 * c2 * s3,
        z: c1 * c2 * s3 + s1 * s2 * c3,
        w: c1 * c2 * c3 - s1 * s2 * s3,
    });
}

/**
 * Camera-style yaw/pitch orientation with no roll.
 * Yaw is a world-Y turn; pitch is a local-X tilt after yaw.
 */
export function quatFromYawPitch(yawY: number, pitchX: number): Quat {
    const cy = Math.cos(yawY / 2);
    const sy = Math.sin(yawY / 2);
    const cx = Math.cos(pitchX / 2);
    const sx = Math.sin(pitchX / 2);

    return normalizeQuat({
        x: cy * sx,
        y: sy * cx,
        z: -sy * sx,
        w: cy * cx,
    });
}

/** Extract intrinsic Euler XYZ from a unit quaternion. */
export function eulerXYZFromQuat(x: number, y: number, z: number, w: number): EulerXYZ {
    const q = normalizeQuat({ x, y, z, w });

    const sinrCosp = 2 * (q.w * q.x + q.y * q.z);
    const cosrCosp = 1 - 2 * (q.x * q.x + q.y * q.y);
    const ex = Math.atan2(sinrCosp, cosrCosp);

    const sinp = 2 * (q.w * q.y - q.z * q.x);
    let ey: number;
    if (Math.abs(sinp) >= 1) {
        ey = Math.sign(sinp) * (Math.PI / 2);
    } else {
        ey = Math.asin(sinp);
    }

    const sinyCosp = 2 * (q.w * q.z + q.x * q.y);
    const cosyCosp = 1 - 2 * (q.y * q.y + q.z * q.z);
    const ez = Math.atan2(sinyCosp, cosyCosp);

    return { x: ex, y: ey, z: ez };
}

/** Apply an incremental yaw (world Y) rotation in place on stored quaternion components. */
export function rotateYInPlace(
    get: () => Quat,
    set: (q: Quat) => void,
    deltaRadians: number,
): void {
    const half = deltaRadians / 2;
    const sy = Math.sin(half);
    const cy = Math.cos(half);
    const q = get();
    // World-space yaw: q' = q_yaw * q
    const nx = cy * q.x + sy * q.w;
    const ny = cy * q.y - sy * q.z;
    const nz = cy * q.z + sy * q.y;
    const nw = cy * q.w - sy * q.x;
    set(normalizeQuat({ x: nx, y: ny, z: nz, w: nw }));
}

/**
 * Legacy scene/prefab payloads used `{ x, y, z }` euler; normalize to quaternion fields.
 */
export function normalizeRotationSpawnFields(
    fields: Record<string, unknown>,
): Record<string, unknown> {
    const x = fields.x;
    const y = fields.y;
    const z = fields.z;
    const w = fields.w;

    if (
        typeof x === "number" &&
        typeof y === "number" &&
        typeof z === "number" &&
        typeof w === "number" &&
        Number.isFinite(w)
    ) {
        const q = normalizeQuat({ x, y, z, w });
        return { x: q.x, y: q.y, z: q.z, w: q.w };
    }

    if (typeof x === "number" && typeof y === "number" && typeof z === "number") {
        const q = quatFromEulerXYZ(x, y, z);
        return { x: q.x, y: q.y, z: q.z, w: q.w };
    }

    return { x: 0, y: 0, z: 0, w: 1 };
}
