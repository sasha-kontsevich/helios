import type { Engine, EngineAPI } from "@merlinn/helios-core";
import { Editor, type EditorOptions } from "./Editor";
import { EditorTransformManipulator } from "./manipulators/EditorTransformManipulator";
import { SelectionBus } from "./selection/SelectionBus";
import { CompositeViewportPointerGate } from "./viewport";
import { EditorSceneView } from "./view/EditorSceneView";
import { EditorSelectionOverlay } from "./view/EditorSelectionOverlay";

export interface CreateEditorOptions extends EditorOptions {
    api: EngineAPI;
    /** If set, {@link EditorSceneView.attach} runs immediately (engine must already be inited). */
    engine?: Engine;
    /** When false, skip transform gizmo / viewport gate wiring (tests, headless). @default true */
    enableTransformManipulator?: boolean;
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
    const { api, engine: initialEngine, enableTransformManipulator = true, ...rest } = options;
    const selection = options.selection ?? new SelectionBus();
    const pointerGate = enableTransformManipulator ? new CompositeViewportPointerGate() : undefined;
    const sceneView = new EditorSceneView(selection, undefined, pointerGate);
    const selectionOverlay = new EditorSelectionOverlay(selection);
    const transformManipulator = enableTransformManipulator
        ? new EditorTransformManipulator(api, selection, pointerGate!, sceneView)
        : null;
    const editor = new Editor(api, {
        ...rest,
        selection,
        ...(transformManipulator ? { transformTools: transformManipulator } : {}),
    });
    const attachManipulators = (engine: Engine): void => {
        transformManipulator?.attach(engine);
    };
    if (initialEngine) {
        sceneView.attach(initialEngine);
        selectionOverlay.attach(initialEngine);
        attachManipulators(initialEngine);
    }
    return {
        dispose: () => {
            transformManipulator?.detach();
            selectionOverlay.detach();
            sceneView.detach();
            editor.dispose();
        },
        attachEngine: (engine: Engine) => {
            sceneView.attach(engine);
            selectionOverlay.attach(engine);
            attachManipulators(engine);
        },
    };
}
