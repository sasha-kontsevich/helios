import type { Engine } from "@merlinn/helios-core";
import { THREE_RENDERER_CAPABILITY, type ThreeRenderContext } from "@merlinn/helios-three-plugin";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Wires an editor-only orbit camera to {@link ThreeRenderContext} (not ECS, not `worldRoot`).
 * Call {@link attach} after `engine.init()` so the Three capability exists.
 */
export class EditorSceneView {
    private renderContext: ThreeRenderContext | null = null;
    private controls: OrbitControls | null = null;
    private rafId = 0;

    attach(engine: Engine): void {
        this.detach();

        const rc = engine.context.capabilities.get<ThreeRenderContext>(THREE_RENDERER_CAPABILITY);
        this.renderContext = rc;
        rc.setRenderView("editor");

        const camera = rc.getEditorViewCamera();
        const canvas = rc.getCanvas();
        if (!canvas) {
            throw new Error("[EditorSceneView] Three canvas is not available yet.");
        }

        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.target.set(0, 0, 0);
        this.controls = controls;

        const tick = (): void => {
            this.rafId = requestAnimationFrame(tick);
            this.controls?.update();
        };
        this.rafId = requestAnimationFrame(tick);
    }

    detach(): void {
        if (this.rafId !== 0) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
        this.controls?.dispose();
        this.controls = null;

        if (this.renderContext) {
            this.renderContext.setRenderView("game");
            this.renderContext = null;
        }
    }
}
