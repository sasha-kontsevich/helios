/**
 * Minimal surface for editor tools to cooperate with scene navigation ({@link OrbitControls}, fly)
 * without importing concrete control types.
 */
export interface IEditorViewportNavigation {
    /** When `false`, increments an internal hold count that keeps orbit disabled (unless RMB fly is active). */
    setSceneNavigationEnabled(enabled: boolean): void;
    /** True while RMB fly mode is active — tools must not steal WASD/Q/E hotkeys used for movement. */
    isFlyActive(): boolean;
}
