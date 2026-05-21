import type { EngineAPI } from "@merlinn/helios-core";
import type { EditorContext } from "./EditorContext";
import type { EditorPlugin } from "./EditorPlugin";
import type { ComponentInspectorExtension } from "./inspector/registry/inspectorTypes";
import { createDefaultInspectorRegistry } from "./inspector/registry/createDefaultInspectorRegistry";
import type { ITransformToolController } from "./manipulators/ITransformToolController";
import { createDefaultEditorPlugins } from "./inspector/createDefaultEditorPlugins";
import { noopSelectionBus, type ISelectionBus } from "./selection/SelectionBus";
import type { GameUiHost } from "./gameUi/GameUiHost";
import type { EditorViewportInteractionController } from "./viewport/EditorViewportInteractionMode";
import { PlayModeController, type PlayModeOptions } from "./play/PlayModeController";
import type { EditorModelImportHost } from "./modelImport/types";

export interface EditorOptions {
    /** Defaults to `document.getElementById('editor-root')`. */
    root?: HTMLElement;
    /** Defaults to {@link createDefaultEditorPlugins}. */
    plugins?: EditorPlugin[];
    /** Selection pub/sub; defaults to a noop bus when omitted (standalone {@link Editor} without shell sync). */
    selection?: ISelectionBus;
    /** Extra inspector views; higher {@link ComponentInspectorExtension.priority} overrides built-ins. */
    inspectorExtensions?: readonly ComponentInspectorExtension[];
    /** Viewport transform toolbar target; set by {@link createEditor} when manipulator is enabled. */
    transformTools?: ITransformToolController;
    /** When set (e.g. by {@link createEditor}), the shell can switch editor vs game canvas interaction. */
    viewportInteraction?: EditorViewportInteractionController;
    /** Play Mode hooks and snapshot exclusions (see {@link PlayModeController}). */
    playMode?: PlayModeOptions;
    /** When set (e.g. by {@link createEditor}), reuses the same controller for game UI plugins. */
    playModeController?: PlayModeController;
    /** Host for game-viewport overlay plugins; wired by {@link InspectorEditorPlugin}. */
    gameUiHost?: GameUiHost;
    /** Optional hooks for 3D model import (save bundle, spawn notification). */
    modelImport?: EditorModelImportHost;
}

export class Editor {
    private readonly plugins: EditorPlugin[] = [];

    constructor(private readonly api: EngineAPI, options: EditorOptions = {}) {
        const root =
            options.root ??
            (typeof document !== "undefined" ? document.getElementById("editor-root") : null);

        if (!root) {
            throw new Error('[Editor] Missing root element: pass options.root or add <div id="editor-root">.');
        }

        const plugins = options.plugins ?? createDefaultEditorPlugins();
        const selection = options.selection ?? noopSelectionBus;
        const transformTools = options.transformTools;
        const inspectorRegistry = createDefaultInspectorRegistry(options.inspectorExtensions);
        const playMode = options.playModeController ?? new PlayModeController(this.api, options.playMode);
        const context: EditorContext = {
            api: this.api,
            root,
            selection,
            inspectorRegistry,
            playMode,
            ...(transformTools !== undefined ? { transformTools } : {}),
            ...(options.viewportInteraction !== undefined ? { viewportInteraction: options.viewportInteraction } : {}),
            ...(options.gameUiHost !== undefined ? { gameUiHost: options.gameUiHost } : {}),
            ...(options.modelImport !== undefined ? { modelImport: options.modelImport } : {}),
        };

        for (const plugin of plugins) {
            const result = plugin.setup(context);
            if (result instanceof Promise) {
                void result.catch((err) => {
                    console.error(`[Editor] Plugin "${plugin.id}" setup failed:`, err);
                });
            }
        }

        this.plugins = plugins;
    }

    dispose(): void {
        for (let i = this.plugins.length - 1; i >= 0; i--) {
            this.plugins[i].dispose?.();
        }
        this.plugins.length = 0;
    }
}
