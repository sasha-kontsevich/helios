import { Context } from "@merlinn/helios-core";
import * as THREE from "three";
import { AxesHelper, Color, GridHelper } from "three";

export interface ThreePluginOptions {
    canvasId?: string;
    canvasContainer?: HTMLElement | null;
    backgroundColor?: THREE.ColorRepresentation;
    showGrid?: boolean;
    showAxes?: boolean;
    gridSize?: number;
    gridDivisions?: number;
}

const threeRenderContexts = new WeakMap<Context, ThreeRenderContext>();

export class ThreeRenderContext {
    private scene?: THREE.Scene;
    private renderer?: THREE.WebGLRenderer;
    private canvas?: HTMLCanvasElement;
    private activeCamera?: THREE.Camera;
    private readonly worldRoot = new THREE.Group();
    private gridHelper?: THREE.GridHelper;
    private axesHelper?: THREE.AxesHelper;

    constructor(private readonly options: ThreePluginOptions = {}) {
        this.worldRoot.name = "HeliosWorldRoot";
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

        const ambientLight = new THREE.AmbientLight(0xffffff, 5);
        this.scene.add(ambientLight);

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

    setActiveCamera(camera?: THREE.Camera): void {
        this.activeCamera = camera;
    }

    getActiveCamera(): THREE.Camera | undefined {
        return this.activeCamera;
    }

    dispose(): void {
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

export function setThreeRenderContext(context: Context, renderContext: ThreeRenderContext): void {
    threeRenderContexts.set(context, renderContext);
}

export function getThreeRenderContext(context: Context): ThreeRenderContext {
    const renderContext = threeRenderContexts.get(context);

    if (!renderContext) {
        throw new Error('[ThreeRenderContext] Render context is not registered for the current engine context.');
    }

    return renderContext;
}

export function clearThreeRenderContext(context: Context): void {
    threeRenderContexts.delete(context);
}
