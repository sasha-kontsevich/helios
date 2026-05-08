import type { EditorContext } from "./EditorContext";

/**
 * Editor extensions (panels, tools). Separate from runtime engine plugins.
 */
export interface EditorPlugin {
    readonly id: string;
    setup(context: EditorContext): void | Promise<void>;
    dispose?(): void;
}
