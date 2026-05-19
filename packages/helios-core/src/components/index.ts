import { Types } from "bitecs";
import { defineComponent } from "../engine/Component";

export { Parent } from "./parent";

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
    }
}