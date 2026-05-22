import { Types } from "bitecs";
import { defineComponent } from "@merlinn/helios-core";

/** Orbital path around a center point in the XZ plane (Play-only simulation). */
export const ShipOrbit = defineComponent({
    centerX: Types.f32,
    centerZ: Types.f32,
    radius: Types.f32,
    speed: Types.f32,
    baseY: Types.f32,
    phase: Types.f32,
    /** 1 = yaw aligned to orbit tangent. */
    faceTangent: Types.ui8,
});

/** Vertical bob on top of orbit base height. */
export const ShipBob = defineComponent({
    amplitude: Types.f32,
    frequency: Types.f32,
    phase: Types.f32,
});

/** Roll/pitch sway applied to {@link Rotation}. */
export const ShipSway = defineComponent({
    rollAmplitude: Types.f32,
    pitchAmplitude: Types.f32,
    frequency: Types.f32,
    phase: Types.f32,
    /** Steady inward bank (rad) when paired with {@link ShipOrbit}. */
    bankTowardCenter: Types.f32,
});
