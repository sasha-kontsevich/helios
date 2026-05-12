import {SystemConstructor} from "@merlinn/helios-core";
import {
    UpdateThreeObjectSystem,
    RenderSystem,
    ThreeResourceBuildSystem,
    ThreeSceneSystem, UpdateThreeCameraSystem, UpdateThreeLightSystem, UpdateThreeMeshSystem
} from "@merlinn/helios-three-plugin";
import {RotatingCubeSystem} from "./RotatingCubeSystem";

export const Systems: SystemConstructor[] = [
    RotatingCubeSystem,
    UpdateThreeCameraSystem,
    UpdateThreeLightSystem,
    ThreeResourceBuildSystem,
    UpdateThreeMeshSystem,
    UpdateThreeObjectSystem,
    ThreeSceneSystem,
    RenderSystem,
];
