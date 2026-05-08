import type { EngineAPI } from "@merlinn/helios-core";
import { Editor, type EditorOptions } from "./Editor";

export interface CreateEditorOptions extends EditorOptions {
    api: EngineAPI;
}

/**
 * Mount the default editor shell (inspector UI). Requires peer `vue` at runtime.
 */
export function createEditor(options: CreateEditorOptions): { dispose(): void } {
    const { api, ...rest } = options;
    const editor = new Editor(api, rest);
    return {
        dispose: () => editor.dispose(),
    };
}
