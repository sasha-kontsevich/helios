import {Types} from "bitecs";
import {defineComponent} from "@merlinn/helios-core";

export const Rotating = defineComponent({speed: Types.f32})

export const LifeCell = defineComponent({ gx: Types.i32, gz: Types.i32 });

/** Ghost cell for hover preview — not simulated (no {@link LifeCell}). */
export const LifeCellPreview = defineComponent({ gx: Types.i32, gz: Types.i32 });

export { ShipBob, ShipOrbit, ShipSway } from "./shipMotion";

export const AstrisFlyCamera = defineComponent({
    yaw: Types.f32,
    pitch: Types.f32,
    moveSpeed: Types.f32,
    fastMultiplier: Types.f32,
    lookSensitivity: Types.f32,
    initialized: Types.ui8,
});

// Re-export engine/plugin components from package root to avoid deep-importing source files
// (prevents duplicate module instances in Vite dev, which breaks resource identity).
export {
    Position,
    Rotation,
    Scale,
    Parent,
    Name,
    Geometry,
    Material,
    Mesh,
    Camera,
    AmbientLight,
    DirectionalLight,
    ModelInstance,
    Skybox,
    Fog,
} from "@merlinn/helios-core";
export { ThreeObject, ThreeMesh, MeshResourcesResolved } from "@merlinn/helios-three-plugin";
