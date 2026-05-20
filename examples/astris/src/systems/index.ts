import {SystemConstructor} from "@merlinn/helios-core";
import {
    UpdateThreeObjectSystem,
    RenderSystem,
    ThreeResourceBuildSystem,
    ThreeSceneSystem, UpdateThreeCameraSystem, UpdateThreeLightSystem, UpdateThreeMeshSystem
} from "@merlinn/helios-three-plugin";
import {RotatingCubeSystem} from "./RotatingCubeSystem";
import {GameGridVisualSystem} from "./GameGridVisualSystem";
import { LifeCellsHierarchySystem } from "./LifeCellsHierarchySystem";
import {GameOfLifePointerDrainSystem} from "./GameOfLifePointerDrainSystem";
import { GolHoverPreviewSystem } from "./GolHoverPreviewSystem";
import {GameOfLifeStepSystem} from "./GameOfLifeStepSystem";
import { AstrisFlyCameraSystem } from "./AstrisFlyCameraSystem";

export const Systems: SystemConstructor[] = [
    RotatingCubeSystem,
    UpdateThreeCameraSystem,
    UpdateThreeLightSystem,
    GameGridVisualSystem,
    LifeCellsHierarchySystem,
    GameOfLifePointerDrainSystem,
    GameOfLifeStepSystem,
    GolHoverPreviewSystem,
    ThreeResourceBuildSystem,
    UpdateThreeMeshSystem,
    AstrisFlyCameraSystem,
    UpdateThreeObjectSystem,
    ThreeSceneSystem,
    RenderSystem,
];
