import { defineComponent, Types } from 'bitecs';

export const ThreeMesh = defineComponent({ resourceId: Types.ui32 });

export const ThreeCamera = defineComponent({ resourceId: Types.ui32, fov: Types.f32, aspect: Types.f32, near: Types.f32, far: Types.f32, isActive: Types.ui8 });

export const ThreeLight = defineComponent({ resourceId: Types.ui32, type: Types.ui8, color: Types.ui32, intensity: Types.f32, range: Types.f32 });

export const ThreeScene = defineComponent({ resourceId: Types.ui32 });

export const ThreeRenderer = defineComponent({ resourceId: Types.ui32, canvasId: Types.ui32 });

declare module '@merlinn/helios-core' {
    interface ComponentMap {
        ThreeMesh: typeof ThreeMesh;
        ThreeCamera: typeof ThreeCamera;
        ThreeLight: typeof ThreeLight;
        ThreeScene: typeof ThreeScene;
        ThreeRenderer: typeof ThreeRenderer;
    }
}
