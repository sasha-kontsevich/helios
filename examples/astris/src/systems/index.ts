import {Context} from "@merlinn/helios-core";
import {
    TransformMeshSystem,
    RenderSystem
} from "@merlinn/helios-three-plugin";
import {TestSystem} from "./TestSystem";

export function initSystems(context: Context): void {
    context.systems.register([
        TestSystem,
        TransformMeshSystem,
        RenderSystem,
    ])
}
