import {Types} from "bitecs";
import {defineComponent} from "@merlinn/helios-core";

export const Rotating = defineComponent({speed: Types.f32})

// Re-export engine/plugin components from package root to avoid deep-importing source files
// (prevents duplicate module instances in Vite dev, which breaks resource identity).
export { Position, Rotation, Scale, Parent, Name } from "@merlinn/helios-core";
export {
    ThreeObject,
    ThreeMesh,
    ThreeCamera,
    ThreeAmbientLight,
    ThreeDirectionalLight,
    ThreeGeometryRef,
    ThreeMaterialRef,
    ThreeResourcesBuilt,
} from "@merlinn/helios-three-plugin";
