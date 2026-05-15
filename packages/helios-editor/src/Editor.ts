import type { EngineAPI } from "@merlinn/helios-core";
import type { EditorContext } from "./EditorContext";
import type { EditorPlugin } from "./EditorPlugin";
import type { ComponentInspectorExtension } from "./inspector/registry/inspectorTypes";
import { createDefaultInspectorRegistry } from "./inspector/registry/createDefaultInspectorRegistry";
import type { ITransformToolController } from "./manipulators/ITransformToolController";
import { createDefaultEditorPlugins } from "./inspector/createDefaultEditorPlugins";
import { noopSelectionBus, type ISelectionBus } from "./selection/SelectionBus";
import type { GameSimulationControls } from "./gameSimulationControls";
import type { EditorViewportInteractionController } from "./viewport/EditorViewportInteractionMode";
import { PlayModeController, type PlayModeOptions } from "./play/PlayModeController";

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
    /**
     * When set, the game tab shows a pause control bound to {@link EngineAPI.getCapability}(`key`)
     * if the value implements {@link GameSimulationControls}.
     */
    gameSimulationCapabilityKey?: string;
    /** Play Mode hooks and snapshot exclusions (see {@link PlayModeController}). */
    playMode?: PlayModeOptions;
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
        const playMode = new PlayModeController(this.api, options.playMode);
        const context: EditorContext = {
            api: this.api,
            root,
            selection,
            inspectorRegistry,
            playMode,
            ...(transformTools !== undefined ? { transformTools } : {}),
            ...(options.viewportInteraction !== undefined ? { viewportInteraction: options.viewportInteraction } : {}),
            ...(options.gameSimulationCapabilityKey !== undefined
                ? { gameSimulationCapabilityKey: options.gameSimulationCapabilityKey }
                : {}),
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
