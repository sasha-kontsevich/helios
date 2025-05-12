import {defineComponent, Types} from "bitecs";

export const Fps = defineComponent({rawValue: Types.f32})

declare module '@merlinn/helios-core' {
    interface ComponentMap {
        Fps: typeof Fps;
    }
}
