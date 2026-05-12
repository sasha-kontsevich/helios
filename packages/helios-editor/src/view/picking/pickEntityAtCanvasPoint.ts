import type { Engine } from "@merlinn/helios-core";
import {
    THREE_RENDERER_CAPABILITY,
    resolvePickingEntityEidFromObject,
    type ThreeRenderContext,
} from "@merlinn/helios-three-plugin";
import * as THREE from "three";

/**
 * Raycasts from the canvas pixel into {@link ThreeRenderContext.getWorldRoot} and returns the first
 * ECS entity id found via {@link resolvePickingEntityEidFromObject} on hit objects.
 */
export function pickEntityAtCanvasPoint(
    engine: Engine,
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number,
): number | null {
    const rc = engine.context.capabilities.get<ThreeRenderContext>(THREE_RENDERER_CAPABILITY);
    if (!rc) {
        return null;
    }
    const world = engine.context.ecsWorld;
    const camera = rc.resolveRenderCamera(world);
    if (!camera) {
        return null;
    }
    const worldRoot = rc.getWorldRoot();
    const rect = canvas.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    /** Default Line threshold is 1 world unit — far wider than visible edges; steals hits between nearby meshes. */
    raycaster.params.Line = { threshold: 0 };
    raycaster.params.Points = { threshold: 0 };
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    const hits = raycaster.intersectObject(worldRoot, true);
    for (const hit of hits) {
        const obj = hit.object;
        if (obj instanceof THREE.Line || obj instanceof THREE.LineSegments || obj instanceof THREE.Points) {
            continue;
        }
        const eid = resolvePickingEntityEidFromObject(obj);
        if (eid !== null) {
            return eid;
        }
    }
    return null;
}
