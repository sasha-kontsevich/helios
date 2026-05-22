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
    UpdateSkyboxSystem,
    UpdateFogSystem,
} from "@merlinn/helios-three-plugin";
import {RotatingCubeSystem} from "./RotatingCubeSystem";
import {GameGridVisualSystem} from "./GameGridVisualSystem";
import { LifeCellsHierarchySystem } from "./LifeCellsHierarchySystem";
import {GameOfLifePointerDrainSystem} from "./GameOfLifePointerDrainSystem";
import { GolHoverSyncSystem } from "./GolHoverSyncSystem";
import { LifeCellInstancedRenderSystem } from "./LifeCellInstancedRenderSystem";
import {GameOfLifeStepSystem} from "./GameOfLifeStepSystem";
import { AstrisFlyCameraSystem } from "./AstrisFlyCameraSystem";
import { ShipBobSystem } from "./ShipBobSystem";
import { ShipOrbitSystem } from "./ShipOrbitSystem";
import { ShipSwayRotationSystem } from "./ShipSwayRotationSystem";

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
    ShipOrbitSystem,
    ShipBobSystem,
    ShipSwayRotationSystem,
    EnsureThreeRenderableSystem,
    ThreeResourceBuildSystem,
    UpdateThreeMeshSystem,
    AstrisFlyCameraSystem,
    UpdateThreeObjectSystem,
    ThreeSceneSystem,
    UpdateSkyboxSystem,
    UpdateFogSystem,
    RenderSystem,
];
