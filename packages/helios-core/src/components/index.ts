import { defineComponent, Types } from 'bitecs';

export const Position = defineComponent({ x: Types.f32, y: Types.f32, z: Types.f32 });

export const Rotation = defineComponent({ x: Types.f32, y: Types.f32, z: Types.f32 });

export const Scale = defineComponent({ x: Types.f32, y: Types.f32, z: Types.f32 });


declare module '../types/ComponentMap' {
    interface ComponentMap {
        Position: typeof Position;
        Rotation: typeof Rotation;
        Scale: typeof Scale;
    }
}
