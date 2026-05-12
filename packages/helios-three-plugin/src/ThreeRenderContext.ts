import type { Context } from "@merlinn/helios-core";
import { entityExists, hasComponent } from "bitecs";
import type { IWorld } from "bitecs";
import * as THREE from "three";
import { AxesHelper, Color, GridHelper } from "three";
import { ThreeCamera, ThreeObject } from "./components";

/** Capability key registered by {@link ThreePlugin}. */
export const THREE_RENDERER_CAPABILITY = "renderer.three";

/** Which camera drives `resolveRenderCamera()` (future: split, pilot). */
export type HeliosRenderView = "game" | "editor";

export interface ThreePluginOptions {
    canvasId?: string;
    canvasContainer?: HTMLElement | null;
    backgroundColor?: THREE.ColorRepresentation;
    showGrid?: boolean;
    showAxes?: boolean;
    gridSize?: number;
    gridDivisions?: number;
}

export class ThreeRenderContext {
    private scene?: THREE.Scene;
    private renderer?: THREE.WebGLRenderer;
    private canvas?: HTMLCanvasElement;
    private activeCamera?: THREE.Camera;
    private readonly worldRoot = new THREE.Group();
    /** Editor-only THREE objects (gizmos, overlays); not part of serialized game world. */
    private readonly editorRoot = new THREE.Group();
    private editorViewCamera?: THREE.PerspectiveCamera;
    private renderView: HeliosRenderView = "game";
    private gridHelper?: THREE.GridHelper;
    private axesHelper?: THREE.AxesHelper;
    /**
     * Editor viewport: render through this ECS `ThreeCamera` entity, or `null` for the free
     * {@link getEditorViewCamera}. Entity pose is driven by ECS (orbit/fly are disabled for ECS cameras).
     */
    private editorRenderCameraEid: number | null = null;

    /** Invoked each frame immediately before `WebGLRenderer.render` (after ECS systems). */
    private readonly beforeRenderHooks: Array<() => void> = [];

    constructor(private readonly options: ThreePluginOptions = {}) {
        this.worldRoot.name = "HeliosWorldRoot";
        this.editorRoot.name = "HeliosEditorRoot";
    }

    init(): void {
        if (this.scene && this.renderer) {
            return;
        }

        const canvas = this.resolveCanvas();
        if (!canvas) {
            throw new Error('[ThreeRenderContext] Unable to resolve a canvas for the Three renderer.');
        }

        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.scene.background = new Color(this.options.backgroundColor ?? 0x333333);
        this.scene.add(this.worldRoot);
        this.scene.add(this.editorRoot);

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.syncViewportSize();
        this.attachHelpers();
    }

    syncViewportSize(): void {
        if (!this.renderer || !this.canvas) {
            return;
        }

        const width = Math.max(1, this.canvas.clientWidth || window.innerWidth);
        const height = Math.max(1, this.canvas.clientHeight || window.innerHeight);

        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.renderer.setSize(width, height, false);
        }

        this.renderer.setPixelRatio(window.devicePixelRatio);

        const aspect = width / height;
        const ec = this.editorViewCamera;
        if (ec) {
            ec.aspect = aspect;
            ec.updateProjectionMatrix();
        }
    }

    getScene(): THREE.Scene {
        if (!this.scene) {
            throw new Error('[ThreeRenderContext] Scene has not been initialized.');
        }

        return this.scene;
    }

    getRenderer(): THREE.WebGLRenderer {
        if (!this.renderer) {
            throw new Error('[ThreeRenderContext] Renderer has not been initialized.');
        }

        return this.renderer;
    }

    getCanvas(): HTMLCanvasElement | undefined {
        return this.canvas;
    }

    getWorldRoot(): THREE.Group {
        return this.worldRoot;
    }

    /** THREE group for editor-only content; parented to scene, not {@link getWorldRoot}. */
    getEditorRoot(): THREE.Group {
        return this.editorRoot;
    }

    getRenderView(): HeliosRenderView {
        return this.renderView;
    }

    setRenderView(view: HeliosRenderView): void {
        this.renderView = view;
    }

    /**
     * Editor viewport camera (not an ECS entity). Not under `worldRoot`.
     * Lazily created so headless / non-editor runs pay no cost.
     */
    getEditorViewCamera(): THREE.PerspectiveCamera {
        if (!this.editorViewCamera) {
            const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 5000);
            // Free "spawn" pose — not lookAt(worldOrigin), so fly/orbit are not implicitly locked to (0,0,0).
            cam.position.set(12, 9, 12);
            cam.rotation.order = "YXZ";
            cam.rotation.set(-0.42, 0.75, 0);
            this.editorViewCamera = cam;
            this.syncViewportSize();
        }
        return this.editorViewCamera;
    }

    /** Which ECS entity drives the editor viewport when not using the free camera. */
    getEditorRenderCameraEid(): number | null {
        return this.editorRenderCameraEid;
    }

    /** Select the editor viewport camera; `null` restores the free orbit/fly camera. */
    setEditorRenderCameraEid(eid: number | null): void {
        this.editorRenderCameraEid = eid;
    }

    private tryResolveEditorEcsCamera(world: IWorld): THREE.PerspectiveCamera | undefined {
        const eid = this.editorRenderCameraEid;
        if (eid === null) {
            return undefined;
        }
        if (!entityExists(world as any, eid)) {
            return undefined;
        }
        if (!hasComponent(world, ThreeCamera as any, eid) || !hasComponent(world, ThreeObject as any, eid)) {
            return undefined;
        }
        const obj = ThreeObject.get(eid).object;
        return obj instanceof THREE.PerspectiveCamera ? obj : undefined;
    }

    /** Camera used this frame: editor view / picked ECS camera, or ECS `activeCamera` in game view. */
    resolveRenderCamera(world: IWorld): THREE.Camera | undefined {
        if (this.renderView === "editor") {
            if (this.editorRenderCameraEid !== null) {
                const ecsCam = this.tryResolveEditorEcsCamera(world);
                if (ecsCam) {
                    return ecsCam;
                }
                this.editorRenderCameraEid = null;
            }
            return this.getEditorViewCamera();
        }
        return this.activeCamera;
    }

    setActiveCamera(camera?: THREE.Camera): void {
        this.activeCamera = camera;
    }

    getActiveCamera(): THREE.Camera | undefined {
        return this.activeCamera;
    }

    /**
     * Register a callback to run immediately before the renderer draws the scene each frame
     * (after all ECS systems have run). Used by the editor to re-sync `TransformControls` when
     * runtime meshes are rebuilt (e.g. descriptor edits).
     */
    registerBeforeRender(callback: () => void): () => void {
        this.beforeRenderHooks.push(callback);
        return () => {
            const i = this.beforeRenderHooks.indexOf(callback);
            if (i >= 0) {
                this.beforeRenderHooks.splice(i, 1);
            }
        };
    }

    /** @internal Called by {@link RenderSystem} only. */
    invokeBeforeRender(): void {
        const hooks = this.beforeRenderHooks.slice();
        for (const h of hooks) {
            try {
                h();
            } catch (err) {
                console.error("[ThreeRenderContext] beforeRender hook failed:", err);
            }
        }
    }

    dispose(): void {
        this.editorRenderCameraEid = null;
        this.beforeRenderHooks.length = 0;
        this.editorRoot.clear();
        this.editorRoot.removeFromParent();
        this.editorViewCamera = undefined;

        this.worldRoot.clear();
        this.axesHelper?.removeFromParent();
        this.gridHelper?.removeFromParent();
        this.renderer?.dispose();
        this.activeCamera = undefined;
    }

    private resolveCanvas(): HTMLCanvasElement | null {
        const canvasId = this.options.canvasId ?? "three-scene";
        const byId = document.getElementById(canvasId);

        if (byId instanceof HTMLCanvasElement) {
            return byId;
        }

        if (!this.options.canvasContainer) {
            return null;
        }

        const existingCanvas = this.options.canvasContainer.querySelector("canvas");
        if (existingCanvas instanceof HTMLCanvasElement) {
            return existingCanvas;
        }

        const canvas = document.createElement("canvas");
        canvas.id = canvasId;
        this.options.canvasContainer.appendChild(canvas);
        return canvas;
    }

    private attachHelpers(): void {
        const scene = this.getScene();

        if (this.options.showGrid ?? true) {
            this.gridHelper = new GridHelper(
                this.options.gridSize ?? 1000,
                this.options.gridDivisions ?? 1000,
                new Color(0x666666),
                new Color(0x444444),
            );
            this.gridHelper.position.y = -0.001;
            scene.add(this.gridHelper);
        }

        if (this.options.showAxes ?? true) {
            this.axesHelper = new AxesHelper(2.5);
            scene.add(this.axesHelper);
        }
    }
}

export function getThreeRenderContext(context: Context): ThreeRenderContext {
    return context.capabilities.get<ThreeRenderContext>(THREE_RENDERER_CAPABILITY);
}

/** Removes the renderer capability from the context (e.g. after dispose). */
export function clearThreeRenderContext(context: Context): void {
    context.capabilities.delete(THREE_RENDERER_CAPABILITY);
}
