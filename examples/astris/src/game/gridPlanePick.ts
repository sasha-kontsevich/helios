import type { Engine } from "@merlinn/helios-core";
import { THREE_RENDERER_CAPABILITY, type ThreeRenderContext } from "@merlinn/helios-three-plugin";
import * as THREE from "three";

const _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _hit = new THREE.Vector3();
const _ndc = new THREE.Vector2();

/** Raycast from pointer onto the XZ grid plane (Y = 0), snapped to integer cells. */
export function pickGridCell(
    engine: Engine,
    canvas: HTMLCanvasElement,
    e: PointerEvent,
): { gx: number; gz: number } | null {
    if (e.altKey) {
        return null;
    }
    const rc = engine.context.capabilities.getOrUndefined<ThreeRenderContext>(THREE_RENDERER_CAPABILITY);
    if (!rc) {
        return null;
    }
    const camera = rc.getActiveCamera();
    if (!camera) {
        return null;
    }

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
        return null;
    }
    _ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(_ndc, camera);

    const hit = raycaster.ray.intersectPlane(_plane, _hit);
    if (hit === null) {
        return null;
    }

    return { gx: Math.round(hit.x), gz: Math.round(hit.z) };
}
