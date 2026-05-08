import {SystemConstructor} from "@merlinn/helios-core";
import {
    UpdateThreeObjectSystem,
    RenderSystem,
    ThreeResourceBuildSystem,
    ThreeSceneSystem, UpdateThreeCameraSystem, UpdateThreeMeshSystem
} from "@merlinn/helios-three-plugin";
import {TestSystem} from "./TestSystem";
import {RotatingCubeSystem} from "./RotatingCubeSystem";

export const Systems: SystemConstructor[] = [
    TestSystem,
    RotatingCubeSystem,
    UpdateThreeCameraSystem,
    ThreeResourceBuildSystem,
    UpdateThreeMeshSystem,
    UpdateThreeObjectSystem,
    ThreeSceneSystem,
    RenderSystem,
];
