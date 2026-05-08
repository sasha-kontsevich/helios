import {SystemConstructor} from "@merlinn/helios-core";
import {
    UpdateThreeObjectSystem,
    RenderSystem,
    ThreeSceneSystem, UpdateThreeCameraSystem, UpdateThreeMeshSystem
} from "@merlinn/helios-three-plugin";
import {TestSystem} from "./TestSystem";
import {RotatingCubeSystem} from "./RotatingCubeSystem";

export const Systems: SystemConstructor[] = [
    TestSystem,
    RotatingCubeSystem,
    UpdateThreeCameraSystem,
    UpdateThreeMeshSystem,
    UpdateThreeObjectSystem,
    ThreeSceneSystem,
    RenderSystem,
];
