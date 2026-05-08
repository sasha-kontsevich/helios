import {Types} from "bitecs";
import {defineComponent} from "@merlinn/helios-core";

export const Fps = defineComponent({rawValue: Types.f32})
export const Rotating = defineComponent({speed: Types.f32})

// Re-export engine/plugin components from package root to avoid deep-importing source files
// (prevents duplicate module instances in Vite dev, which breaks resource identity).
export { Position, Rotation, Scale, Parent } from "@merlinn/helios-core";
export {
    ThreeObject,
    ThreeMesh,
    ThreeCamera,
    ThreeLight,
    ThreeGeometryRef,
    ThreeMaterialRef,
    ThreeResourcesBuilt,
} from "@merlinn/helios-three-plugin";
