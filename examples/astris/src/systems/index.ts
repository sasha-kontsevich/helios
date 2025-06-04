import {SystemConstructor} from "@merlinn/helios-core";
import {
    TransformMeshSystem,
    RenderSystem,
    ThreeSceneSystem
} from "@merlinn/helios-three-plugin";
import {TestSystem} from "./TestSystem";
import {RotatingCubeSystem} from "./RotatingCubeSystem";

export const Systems: SystemConstructor[] = [
    TestSystem,
    RotatingCubeSystem,
    ThreeSceneSystem,
    TransformMeshSystem,
    RenderSystem,
];
