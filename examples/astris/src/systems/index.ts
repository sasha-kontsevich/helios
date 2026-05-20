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
import { LifeCellsPreviewHierarchySystem } from "./LifeCellsPreviewHierarchySystem";
import {GameOfLifePointerDrainSystem} from "./GameOfLifePointerDrainSystem";
import { GolHoverSyncSystem } from "./GolHoverSyncSystem";
import {GameOfLifeStepSystem} from "./GameOfLifeStepSystem";
import { AstrisFlyCameraSystem } from "./AstrisFlyCameraSystem";

export const Systems: SystemConstructor[] = [
    RotatingCubeSystem,
    UpdateThreeCameraSystem,
    UpdateThreeLightSystem,
    GameGridVisualSystem,
    LifeCellsHierarchySystem,
    LifeCellsPreviewHierarchySystem,
    GameOfLifePointerDrainSystem,
    GameOfLifeStepSystem,
    GolHoverSyncSystem,
    ThreeResourceBuildSystem,
    UpdateThreeMeshSystem,
    AstrisFlyCameraSystem,
    UpdateThreeObjectSystem,
    ThreeSceneSystem,
    RenderSystem,
];
