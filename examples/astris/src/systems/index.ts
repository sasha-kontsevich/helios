import {SystemConstructor} from "@merlinn/helios-core";
import { ViewportFlyCameraSystem } from "@merlinn/helios-input-plugin";
import {
    UpdateThreeObjectSystem,
    RenderSystem,
    ThreeResourceBuildSystem,
    ThreeSceneSystem, UpdateThreeCameraSystem, UpdateThreeLightSystem, UpdateThreeMeshSystem
} from "@merlinn/helios-three-plugin";
import {RotatingCubeSystem} from "./RotatingCubeSystem";
import {GameGridVisualSystem} from "./GameGridVisualSystem";
import {GameOfLifePointerDrainSystem} from "./GameOfLifePointerDrainSystem";
import {GameOfLifeStepSystem} from "./GameOfLifeStepSystem";

export const Systems: SystemConstructor[] = [
    RotatingCubeSystem,
    UpdateThreeCameraSystem,
    UpdateThreeLightSystem,
    GameGridVisualSystem,
    GameOfLifePointerDrainSystem,
    GameOfLifeStepSystem,
    ThreeResourceBuildSystem,
    UpdateThreeMeshSystem,
    ViewportFlyCameraSystem,
    UpdateThreeObjectSystem,
    ThreeSceneSystem,
    RenderSystem,
];
