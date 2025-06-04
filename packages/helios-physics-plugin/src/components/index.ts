import { Types } from 'bitecs';
import {defineComponent} from "@merlinn/helios-core";

export const Velocity = defineComponent({ x: Types.f32, y: Types.f32, z: Types.f32 });

declare module '@merlinn/helios-core' {
    interface ComponentMap {
        Velocity: typeof Velocity;
    }
}
