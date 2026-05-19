import type { GameUiContext } from "./GameUiContext";

/**
 * DOM overlay extensions for the game viewport (HUD, menus). Separate from {@link EditorPlugin}.
 */
export interface GameUiPlugin {
    readonly id: string;
    setup(context: GameUiContext): void | Promise<void>;
    dispose?(): void;
}
