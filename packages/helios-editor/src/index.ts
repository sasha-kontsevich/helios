import "./ui/heliosChrome.css";

export type { EditorContext } from "./EditorContext";
export {
    EDITOR_PLAY_SESSION_CAPABILITY,
    type EditorPlaySessionState,
    EDITOR_SHELL_ACTIVE_VIEW_CAPABILITY,
    type EditorShellActiveView,
    type EditorShellActiveViewState,
    type SystemRuntimeSnapshot,
} from "@merlinn/helios-core";
export type { ISelectionBus, SelectionEid, SelectionSubscriber } from "./selection/SelectionBus";
export { SelectionBus, noopSelectionBus } from "./selection/SelectionBus";
export type { EditorPlugin } from "./EditorPlugin";
export { Editor, type EditorOptions } from "./Editor";
export { createEditor, type CreateEditorOptions, type EditorHandle } from "./createEditor";
export type { GameSimulationControls } from "./gameSimulationControls";
export { PlayModeController, type PlayModeOptions } from "./play/PlayModeController";
export type { EditorViewportInteractionController, EditorViewportInteractionMode } from "./viewport/EditorViewportInteractionMode";
export { EditorSceneView } from "./view/EditorSceneView";
export type { SceneNavigationPolicy } from "./view/picking/SceneNavigationPolicy";
export { UnityLikeSceneNavigationPolicy } from "./view/picking/SceneNavigationPolicy";
export { pickEntityAtCanvasPoint } from "./view/picking/pickEntityAtCanvasPoint";
export {
    CompositeViewportPointerGate,
    createViewportPickContext,
    GAME_VIEWPORT_POINTER_SINK_CAPABILITY,
    type IEditorViewportNavigation,
    type IGameViewportPointerSink,
    type IViewportPointerGate,
    type ViewportPickContext,
} from "./viewport";
export { EditorTransformManipulator } from "./manipulators/EditorTransformManipulator";
export type { ITransformToolController, TransformToolMode } from "./manipulators/ITransformToolController";
export { writeEcsTransformFromObject3D } from "./manipulators/writeEcsTransformFromObject3D";
export { InspectorEditorPlugin } from "./inspector/InspectorEditorPlugin";
export { createDefaultEditorPlugins } from "./inspector/createDefaultEditorPlugins";
export {
    INTERNAL_INSPECTOR_COMPONENT_NAMES,
    isInternalInspectorComponent,
} from "./inspector/internalComponents";
export type { ComponentInspectorExtension } from "./inspector/registry/inspectorTypes";
export { EditorInspectorRegistry } from "./inspector/registry/EditorInspectorRegistry";
export { createDefaultInspectorRegistry } from "./inspector/registry/createDefaultInspectorRegistry";
