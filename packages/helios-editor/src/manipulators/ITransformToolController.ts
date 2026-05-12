export type TransformToolMode = "translate" | "rotate" | "scale";

/**
 * Viewport transform toolbar ↔ {@link EditorTransformManipulator}. Optional on {@link EditorContext}
 * when the manipulator is disabled.
 */
export interface ITransformToolController {
    getMode(): TransformToolMode;
    getGizmoUiVisible(): boolean;
    setMode(mode: TransformToolMode): void;
    setGizmoUiVisible(visible: boolean): void;
    /** Notifies after mode or gizmo visibility changes (including hotkeys). Initial sync: call `listener` once on subscribe. */
    subscribe(listener: () => void): () => void;
}
