import type { Context } from "@merlinn/helios-core";
import * as THREE from "three";
import { AxesHelper, Color, GridHelper } from "three";

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
            cam.position.set(5, 4, 6);
            cam.lookAt(0, 0, 0);
            this.editorViewCamera = cam;
            this.syncViewportSize();
        }
        return this.editorViewCamera;
    }

    /** Camera used this frame: editor view camera or ECS `activeCamera` in game view. */
    resolveRenderCamera(): THREE.Camera | undefined {
        if (this.renderView === "editor") {
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

    dispose(): void {
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
