import { Types } from "bitecs";
import { defineComponent } from "../engine/Component";

const STRING_FIELD = "";

/**
 * Serializable geometry source (GUID asset or inline descriptor).
 * Resolved to GPU geometry by the render backend (e.g. three-plugin).
 */
export const Geometry = defineComponent({
    guid: STRING_FIELD,
    descriptor: Object.freeze({}) as object,
});

/**
 * Serializable material source (GUID asset or inline descriptor).
 * Resolved to GPU material by the render backend.
 */
export const Material = defineComponent({
    guid: STRING_FIELD,
    descriptor: Object.freeze({}) as object,
});

/** Tag: entity is drawn as a mesh when {@link Geometry} + {@link Material} are present. */
export const Mesh = defineComponent({});

/** Perspective camera parameters; aspect ratio is owned by the render viewport. */
export const Camera = defineComponent({
    fov: Types.f32,
    near: Types.f32,
    far: Types.f32,
});

export const AmbientLight = defineComponent({ intensity: Types.f32 });

export const DirectionalLight = defineComponent({
    intensity: Types.f32,
    targetEntity: Types.ui32,
});
