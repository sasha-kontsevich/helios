import type { EditorShellActiveView, EngineAPI } from "@merlinn/helios-core";
import type { PlayModeController } from "../play/PlayModeController";

/**
 * Context passed to {@link GameUiPlugin.setup} when the game UI overlay mount is ready.
 */
export interface GameUiContext {
    readonly api: EngineAPI;
    /** Overlay root above `#helios-game-view` (pointer-events: none on container). */
    readonly root: HTMLElement;
    getActiveView(): EditorShellActiveView;
    subscribeActiveView(listener: (view: EditorShellActiveView) => void): () => void;
    readonly playMode: PlayModeController;
}
