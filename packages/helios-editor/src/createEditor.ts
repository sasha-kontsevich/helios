import type { Engine, EngineAPI } from "@merlinn/helios-core";
import { Editor, type EditorOptions } from "./Editor";
import { SelectionBus } from "./selection/SelectionBus";
import { EditorSceneView } from "./view/EditorSceneView";
import { EditorSelectionOverlay } from "./view/EditorSelectionOverlay";

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
    const selection = options.selection ?? new SelectionBus();
    const editor = new Editor(api, { ...rest, selection });
    const sceneView = new EditorSceneView();
    const selectionOverlay = new EditorSelectionOverlay(selection);
    if (initialEngine) {
        sceneView.attach(initialEngine);
        selectionOverlay.attach(initialEngine);
    }
    return {
        dispose: () => {
            selectionOverlay.detach();
            sceneView.detach();
            editor.dispose();
        },
        attachEngine: (engine: Engine) => {
            sceneView.attach(engine);
            selectionOverlay.attach(engine);
        },
    };
}
