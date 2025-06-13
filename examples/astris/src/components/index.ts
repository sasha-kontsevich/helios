import {Types} from "bitecs";
import {defineComponent} from "@merlinn/helios-core";

export const Fps = defineComponent({rawValue: Types.f32})
export const Rotating = defineComponent({speed: Types.f32})
export * from '@merlinn/helios-core/components'
export * from '@merlinn/helios-three-plugin/components'
