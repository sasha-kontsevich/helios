import {SystemConstructor} from "@merlinn/helios-core";
import {
    TransformMeshSystem,
    RenderSystem
} from "@merlinn/helios-three-plugin";
import {TestSystem} from "./TestSystem";

export const Systems: SystemConstructor[] = [
    TestSystem,
    TransformMeshSystem,
    RenderSystem,
];
