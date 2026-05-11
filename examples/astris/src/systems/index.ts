import {SystemConstructor} from "@merlinn/helios-core";
import {
    UpdateThreeObjectSystem,
    RenderSystem,
    ThreeResourceBuildSystem,
    ThreeSceneSystem, UpdateThreeCameraSystem, UpdateThreeLightSystem, UpdateThreeMeshSystem
} from "@merlinn/helios-three-plugin";
import {TestSystem} from "./TestSystem";
import {RotatingCubeSystem} from "./RotatingCubeSystem";

export const Systems: SystemConstructor[] = [
    TestSystem,
    RotatingCubeSystem,
    UpdateThreeCameraSystem,
    UpdateThreeLightSystem,
    ThreeResourceBuildSystem,
    UpdateThreeMeshSystem,
    UpdateThreeObjectSystem,
    ThreeSceneSystem,
    RenderSystem,
];
