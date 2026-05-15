/**
 * Registered by the editor host (`createEditor.attachEngine`). Tells {@link SystemManager}
 * to treat the engine as an editor host: simulation systems (`runsInEditor === false`) stay
 * disabled until Enter Play; lifecycle uses `enabled` / `start`, not `update` filtering here.
 *
 * **`active`** mirrors Enter/Exit Play (`PlayModeController`). Game or editor code may read it;
 * {@link SystemManager} only checks capability presence, not `active`.
 *
 * Standalone game builds omit this capability — every system stays enabled.
 */
export const EDITOR_PLAY_SESSION_CAPABILITY = "editor.playSession" as const;

export interface EditorPlaySessionState {
    /** `true` after Enter Play until Exit Play (Unity-like snapshot session). */
    active: boolean;
}
