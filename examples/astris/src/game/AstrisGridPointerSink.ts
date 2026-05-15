import type { Engine } from "@merlinn/helios-core";
import { THREE_RENDERER_CAPABILITY, type ThreeRenderContext } from "@merlinn/helios-three-plugin";
import type { IGameViewportPointerSink } from "@merlinn/helios-editor";
import * as THREE from "three";
import type { GridClickQueue } from "./GridClickQueue";

const _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _hit = new THREE.Vector3();

/**
 * LMB → ray onto Y=0 plane → snapped grid cell → {@link GridClickQueue}.
 */
export class AstrisGridPointerSink implements IGameViewportPointerSink {
    constructor(private readonly queue: GridClickQueue) {}

    tryHandlePointerDown(engine: Engine, canvas: HTMLCanvasElement, e: PointerEvent): boolean {
        if (e.altKey) {
            return false;
        }
        const rc = engine.context.capabilities.getOrUndefined<ThreeRenderContext>(THREE_RENDERER_CAPABILITY);
        if (!rc) {
            return true;
        }
        const camera = rc.getActiveCamera();
        if (!camera) {
            return true;
        }

        const rect = canvas.getBoundingClientRect();
        const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

        const hit = raycaster.ray.intersectPlane(_plane, _hit);
        if (hit === null) {
            return true;
        }

        const gx = Math.round(hit.x);
        const gz = Math.round(hit.z);
        this.queue.enqueue(gx, gz);
        return true;
    }
}
