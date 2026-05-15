import type { EngineAPI } from "@merlinn/helios-core";
import type { ITransformToolController } from "./manipulators/ITransformToolController";
import type { EditorInspectorRegistry } from "./inspector/registry/EditorInspectorRegistry";
import type { PlayModeController } from "./play/PlayModeController";
import type { ISelectionBus } from "./selection/SelectionBus";
import type { EditorViewportInteractionController } from "./viewport/EditorViewportInteractionMode";

/**
 * Immutable context passed to {@link EditorPlugin.setup}.
 */
export interface EditorContext {
    readonly api: EngineAPI;
    /** Root mount node for editor UI (full shell or shell container). */
    readonly root: HTMLElement;
    readonly selection: ISelectionBus;
    /** Built-in + host overrides for the ECS inspector (see {@link createDefaultInspectorRegistry}). */
    readonly inspectorRegistry: EditorInspectorRegistry;
    /** Present when {@link createEditor} was built with transform manipulator enabled. */
    readonly transformTools?: ITransformToolController;
    /**
     * Present when the shell was created via {@link createEditor}; drives {@link EditorSceneView}
     * entity pick vs game pointer forwarding.
     */
    readonly viewportInteraction?: EditorViewportInteractionController;
    /** When set, game tab may bind pause UI to {@link EngineAPI.getCapability}. */
    readonly gameSimulationCapabilityKey?: string;
    /** Enter / Exit Play (snapshot restore). Always created by {@link Editor}. */
    readonly playMode: PlayModeController;
}
