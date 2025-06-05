import { Types } from 'bitecs';
import {defineComponent} from "../engine";

export const Position = defineComponent({ x: Types.f32, y: Types.f32, z: Types.f32 });

export const Rotation = defineComponent({ x: Types.f32, y: Types.f32, z: Types.f32 });

export const Scale = defineComponent({ x: Types.f32, y: Types.f32, z: Types.f32 });

export const Parent = defineComponent({   target: Types.eid, current: Types.eid });

declare module '../types/ComponentMap' {
    interface ComponentMap {
        Position: typeof Position;
        Rotation: typeof Rotation;
        Scale: typeof Scale;
    }
}
