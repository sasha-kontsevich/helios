import {SystemConstructor} from "@merlinn/helios-core";
import {
    EnsureThreeRenderableSystem,
    UpdateThreeObjectSystem,
    RenderSystem,
    ThreeResourceBuildSystem,
    ThreeSceneSystem,
    UpdateThreeCameraSystem,
    UpdateThreeLightSystem,
    UpdateThreeMeshSystem,
} from "@merlinn/helios-three-plugin";
import {RotatingCubeSystem} from "./RotatingCubeSystem";
import {GameGridVisualSystem} from "./GameGridVisualSystem";
import { LifeCellsHierarchySystem } from "./LifeCellsHierarchySystem";
import {GameOfLifePointerDrainSystem} from "./GameOfLifePointerDrainSystem";
import { GolHoverSyncSystem } from "./GolHoverSyncSystem";
import { LifeCellInstancedRenderSystem } from "./LifeCellInstancedRenderSystem";
import {GameOfLifeStepSystem} from "./GameOfLifeStepSystem";
import { AstrisFlyCameraSystem } from "./AstrisFlyCameraSystem";

export const Systems: SystemConstructor[] = [
    RotatingCubeSystem,
    UpdateThreeCameraSystem,
    UpdateThreeLightSystem,
    GameGridVisualSystem,
    LifeCellsHierarchySystem,
    LifeCellInstancedRenderSystem,
    GameOfLifePointerDrainSystem,
    GameOfLifeStepSystem,
    GolHoverSyncSystem,
    EnsureThreeRenderableSystem,
    ThreeResourceBuildSystem,
    UpdateThreeMeshSystem,
    AstrisFlyCameraSystem,
    UpdateThreeObjectSystem,
    ThreeSceneSystem,
    RenderSystem,
];
