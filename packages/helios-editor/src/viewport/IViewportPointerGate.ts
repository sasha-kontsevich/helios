import type { ViewportPickContext } from "./ViewportPickContext";

/**
 * Optional capture-phase hook before entity LMB picking. If any gate returns `true`, the editor
 * must not run selection picking or call `stopImmediatePropagation` so other canvas consumers
 * (e.g. {@link TransformControls}) can handle the event.
 */
export interface IViewportPointerGate {
    shouldSuppressEntityPickCapture(e: PointerEvent, ctx: ViewportPickContext): boolean;
}
