import type { Engine } from "@merlinn/helios-core";

/**
 * Optional host hook: when the shell is in **game** viewport mode, {@link EditorSceneView}
 * forwards LMB (capture) here instead of entity picking. Implementations enqueue work for ECS systems.
 */
export const GAME_VIEWPORT_POINTER_SINK_CAPABILITY = "editor.gameViewportPointerSink" as const;

export interface IGameViewportPointerSink {
    /**
     * @returns `true` if the pointer was handled (caller will preventDefault + stopImmediatePropagation).
     */
    tryHandlePointerDown(engine: Engine, canvas: HTMLCanvasElement, e: PointerEvent): boolean;
}
