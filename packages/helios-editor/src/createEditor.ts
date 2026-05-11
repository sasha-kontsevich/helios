import type { Engine, EngineAPI } from "@merlinn/helios-core";
import { Editor, type EditorOptions } from "./Editor";
import { EditorSceneView } from "./view/EditorSceneView";

export interface CreateEditorOptions extends EditorOptions {
    api: EngineAPI;
    /** If set, {@link EditorSceneView.attach} runs immediately (engine must already be inited). */
    engine?: Engine;
}

export interface EditorHandle {
    dispose(): void;
    /** After `engine.init()` — enables editor render view + orbit controls. */
    attachEngine(engine: Engine): void;
}

/**
 * Mount the default editor shell (inspector UI). Requires peer `vue` at runtime.
 */
export function createEditor(options: CreateEditorOptions): EditorHandle {
    const { api, engine: initialEngine, ...rest } = options;
    const editor = new Editor(api, rest);
    const sceneView = new EditorSceneView();
    if (initialEngine) {
        sceneView.attach(initialEngine);
    }
    return {
        dispose: () => {
            sceneView.detach();
            editor.dispose();
        },
        attachEngine: (engine: Engine) => {
            sceneView.attach(engine);
        },
    };
}
