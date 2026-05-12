import type { EngineAPI } from "@merlinn/helios-core";
import type { ITransformToolController } from "./manipulators/ITransformToolController";
import type { ISelectionBus } from "./selection/SelectionBus";

/**
 * Immutable context passed to {@link EditorPlugin.setup}.
 */
export interface EditorContext {
    readonly api: EngineAPI;
    /** Root mount node for editor UI (full shell or shell container). */
    readonly root: HTMLElement;
    readonly selection: ISelectionBus;
    /** Present when {@link createEditor} was built with transform manipulator enabled. */
    readonly transformTools?: ITransformToolController;
}
