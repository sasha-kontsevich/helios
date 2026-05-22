import { Types } from "bitecs";
import { defineComponent } from "../engine/Component";

export { Parent } from "./parent";
import type {
    AmbientLight as AmbientLightComponent,
    Camera as CameraComponent,
    DirectionalLight as DirectionalLightComponent,
    Geometry as GeometryComponent,
    Material as MaterialComponent,
    Mesh as MeshComponent,
    Skybox as SkyboxComponent,
    Fog as FogComponent,
} from "./rendering";
export {
    AmbientLight,
    Camera,
    DirectionalLight,
    Fog,
    Geometry,
    Material,
    Mesh,
    Skybox,
} from "./rendering";
export { ModelInstance } from "./model";
import type { ModelInstance as ModelInstanceComponent } from "./model";

export const Position = defineComponent({ x: Types.f32, y: Types.f32, z: Types.f32 });

/** World orientation as a unit quaternion (x, y, z, w). Editor shows Euler XYZ. */
export const Rotation = defineComponent({ x: Types.f32, y: Types.f32, z: Types.f32, w: Types.f32 });

export const Scale = defineComponent({ x: Types.f32, y: Types.f32, z: Types.f32 });

/** Display name for editor UI and tooling; stored as a resource-backed string field. */
export const Name = defineComponent({ label: "" });
import type { Parent } from "./parent";

declare module "../types/ComponentMap" {
    interface ComponentMap {
        Position: typeof Position;
        Rotation: typeof Rotation;
        Scale: typeof Scale;
        Parent: typeof Parent;
        Name: typeof Name;
        Geometry: typeof GeometryComponent;
        Material: typeof MaterialComponent;
        Mesh: typeof MeshComponent;
        Camera: typeof CameraComponent;
        AmbientLight: typeof AmbientLightComponent;
        DirectionalLight: typeof DirectionalLightComponent;
        Skybox: typeof SkyboxComponent;
        Fog: typeof FogComponent;
        ModelInstance: typeof ModelInstanceComponent;
    }
}