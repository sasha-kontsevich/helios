/**
 * Mutable presentation state: which shell tab owns the GPU render this frame.
 * Registered by {@link createEditor} / shell; read by renderer (e.g. Three) when present.
 */
export const EDITOR_SHELL_ACTIVE_VIEW_CAPABILITY = "editor.shell.activeView" as const;

export type EditorShellActiveView = "editor" | "game";

/** Plain object — shell updates `.activeView` when tabs change. */
export interface EditorShellActiveViewState {
    activeView: EditorShellActiveView;
}
