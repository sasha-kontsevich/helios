import type { Engine } from "@merlinn/helios-core";
import { THREE_RENDERER_CAPABILITY, type ThreeRenderContext } from "@merlinn/helios-three-plugin";
import * as THREE from "three";

/**
 * Shared context for {@link IViewportPointerGate} and entity picking: same camera and raycaster
 * tuning as {@link pickEntityAtCanvasPoint} (line/point threshold 0).
 */
export interface ViewportPickContext {
    readonly engine: Engine;
    readonly canvas: HTMLCanvasElement;
    /** Ray from the pointer through the current render camera, or `null` if the camera is unavailable. */
    getRaycasterForPointerEvent(e: PointerEvent): THREE.Raycaster | null;
}

/**
 * Builds a {@link ViewportPickContext} for the current Three render capability, or `null` if missing.
 */
export function createViewportPickContext(engine: Engine, canvas: HTMLCanvasElement): ViewportPickContext | null {
    const rc = engine.context.capabilities.get<ThreeRenderContext>(THREE_RENDERER_CAPABILITY);
    if (!rc) {
        return null;
    }
    return {
        engine,
        canvas,
        getRaycasterForPointerEvent(e: PointerEvent): THREE.Raycaster | null {
            const world = engine.context.ecsWorld;
            const camera = rc.resolveRenderCamera(world);
            if (!camera) {
                return null;
            }
            const rect = canvas.getBoundingClientRect();
            const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            const raycaster = new THREE.Raycaster();
            raycaster.params.Line = { threshold: 0 };
            raycaster.params.Points = { threshold: 0 };
            raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
            return raycaster;
        },
    };
}
