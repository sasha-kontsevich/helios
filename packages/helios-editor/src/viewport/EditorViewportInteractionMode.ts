/** How the central Three canvas treats primary interaction (LMB). */
export type EditorViewportInteractionMode = "editor" | "game";

export interface EditorViewportInteractionController {
    getMode(): EditorViewportInteractionMode;
    setMode(mode: EditorViewportInteractionMode): void;
}
