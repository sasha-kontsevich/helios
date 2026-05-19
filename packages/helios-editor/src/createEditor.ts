import {
    EDITOR_PLAY_SESSION_CAPABILITY,
    EDITOR_SHELL_ACTIVE_VIEW_CAPABILITY,
    type EditorPlaySessionState,
    type EditorShellActiveView,
    type EditorShellActiveViewState,
    type Engine,
    type EngineAPI,
} from "@merlinn/helios-core";
import { THREE_RENDERER_CAPABILITY, type ThreeRenderContext } from "@merlinn/helios-three-plugin";
import { Editor, type EditorOptions } from "./Editor";
import { GameUiHost } from "./gameUi/GameUiHost";
import type { GameUiPlugin } from "./gameUi/GameUiPlugin";
import { EditorTransformManipulator } from "./manipulators/EditorTransformManipulator";
import { PlayModeController } from "./play/PlayModeController";
import { SelectionBus } from "./selection/SelectionBus";
import { CompositeViewportPointerGate } from "./viewport";
import type {
    EditorViewportInteractionController,
    EditorViewportInteractionMode,
} from "./viewport/EditorViewportInteractionMode";
import { EditorSceneView } from "./view/EditorSceneView";
import { EditorSelectionOverlay } from "./view/EditorSelectionOverlay";

export interface CreateEditorOptions extends EditorOptions {
    api: EngineAPI;
    /** If set, {@link EditorSceneView.attach} runs immediately (engine must already be inited). */
    engine?: Engine;
    /** When false, skip transform gizmo / viewport gate wiring (tests, headless). @default true */
    enableTransformManipulator?: boolean;
    /** DOM overlays mounted above `#helios-game-view` (HUD, menus). */
    gameUiPlugins?: GameUiPlugin[];
}

export interface EditorHandle {
    dispose(): void;
    /** After `engine.init()` — enables editor render view + orbit controls. */
    attachEngine(engine: Engine): void;
    /** Central canvas: entity picking vs game pointer forwarding (see {@link EditorSceneView}). */
    setViewportInteractionMode(mode: EditorViewportInteractionMode): void;
    getViewportInteractionMode(): EditorViewportInteractionMode;
}

/**
 * Mount the default editor shell (inspector UI). Requires peer `vue` at runtime.
 */
export function createEditor(options: CreateEditorOptions): EditorHandle {
    const {
        api,
        engine: initialEngine,
        enableTransformManipulator = true,
        gameUiPlugins = [],
        ...rest
    } = options;
    const selection = options.selection ?? new SelectionBus();
    const pointerGate = enableTransformManipulator ? new CompositeViewportPointerGate() : undefined;
    const sceneView = new EditorSceneView(selection, undefined, pointerGate);
    const selectionOverlay = new EditorSelectionOverlay(selection);
    const transformManipulator = enableTransformManipulator
        ? new EditorTransformManipulator(api, selection, pointerGate!, sceneView)
        : null;

    const playMode = new PlayModeController(api, rest.playMode);
    const gameUiHost = new GameUiHost(api, playMode, gameUiPlugins);

    let attachedEngine: Engine | null = null;

    const applyGamePresentation = (mode: EditorViewportInteractionMode): void => {
        const isGame = mode === "game";
        selectionOverlay.setGamePresentationActive(isGame);
        if (attachedEngine) {
            const rc = attachedEngine.context.capabilities.getOrUndefined<ThreeRenderContext>(
                THREE_RENDERER_CAPABILITY,
            );
            rc?.setSceneHelpersVisible(!isGame);
        }
    };

    let interactionMode: EditorViewportInteractionMode = "editor";

    function shellActiveView(): EditorShellActiveView {
        return interactionMode === "game" ? "game" : "editor";
    }

    function syncShellActiveViewCapability(): void {
        if (!attachedEngine) {
            return;
        }
        const st = attachedEngine.context.capabilities.getOrUndefined<EditorShellActiveViewState>(
            EDITOR_SHELL_ACTIVE_VIEW_CAPABILITY,
        );
        if (st) {
            st.activeView = shellActiveView();
        }
    }

    const viewportInteraction: EditorViewportInteractionController = {
        getMode: () => interactionMode,
        setMode: (mode: EditorViewportInteractionMode) => {
            interactionMode = mode;
            sceneView.setInteractionMode(mode);
            transformManipulator?.setGameViewportActive(mode === "game");
            applyGamePresentation(mode);
            gameUiHost.notifyActiveView(shellActiveView());
            syncShellActiveViewCapability();
        },
    };

    const editor = new Editor(api, {
        ...rest,
        selection,
        viewportInteraction,
        playModeController: playMode,
        gameUiHost,
        ...(transformManipulator ? { transformTools: transformManipulator } : {}),
    });
    const attachManipulators = (engine: Engine): void => {
        transformManipulator?.attach(engine);
    };
    if (initialEngine) {
        attachedEngine = initialEngine;
        initialEngine.context.capabilities.register(EDITOR_SHELL_ACTIVE_VIEW_CAPABILITY, {
            activeView: shellActiveView(),
        } satisfies EditorShellActiveViewState);
        initialEngine.context.capabilities.register(EDITOR_PLAY_SESSION_CAPABILITY, {
            active: false,
        } satisfies EditorPlaySessionState);
        initialEngine.api.applyEditorSystemHostPolicy();
        sceneView.attach(initialEngine);
        selectionOverlay.attach(initialEngine);
        attachManipulators(initialEngine);
        applyGamePresentation(interactionMode);
    }
    return {
        dispose: () => {
            gameUiHost.dispose();
            transformManipulator?.detach();
            selectionOverlay.detach();
            sceneView.detach();
            editor.dispose();
            attachedEngine = null;
        },
        attachEngine: (engine: Engine) => {
            attachedEngine = engine;
            engine.context.capabilities.register(EDITOR_SHELL_ACTIVE_VIEW_CAPABILITY, {
                activeView: shellActiveView(),
            } satisfies EditorShellActiveViewState);
            engine.context.capabilities.register(EDITOR_PLAY_SESSION_CAPABILITY, {
                active: false,
            } satisfies EditorPlaySessionState);
            engine.api.applyEditorSystemHostPolicy();
            sceneView.attach(engine);
            selectionOverlay.attach(engine);
            attachManipulators(engine);
            applyGamePresentation(interactionMode);
        },
        setViewportInteractionMode: (mode: EditorViewportInteractionMode) => {
            viewportInteraction.setMode(mode);
        },
        getViewportInteractionMode: () => viewportInteraction.getMode(),
    };
}
