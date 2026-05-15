/**
 * Read-only runtime view of a registered {@link System} for editor introspection.
 */
export interface SystemRuntimeSnapshot {
    /** `system.constructor.name` (same key as {@link SystemManager.get}). */
    readonly name: string;
    /** Registration order (0 .. n-1). */
    readonly order: number;
    readonly enabled: boolean;
    /** `true` after `start()` since the last `stopAll()` on this instance. */
    readonly started: boolean;
    /** Static `System.runsInEditor === true`. */
    readonly runsInEditor: boolean;
    /**
     * Whether `update` runs this frame — same as `enabled` when editor host policy is applied.
     */
    readonly updateActive: boolean;
}
