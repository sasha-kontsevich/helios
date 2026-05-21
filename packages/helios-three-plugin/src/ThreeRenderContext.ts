import type { Context } from "@merlinn/helios-core";
import { entityExists, hasComponent } from "bitecs";
import type { IWorld } from "bitecs";
import * as THREE from "three";
import { AxesHelper, Color, GridHelper } from "three";
import { Camera } from "@merlinn/helios-core";
import { ThreeObject } from "./components";

/** Capability key registered by {@link ThreePlugin}. */
export const THREE_RENDERER_CAPABILITY = "renderer.three";

export interface ThreePluginOptions {
    /** Primary shell tab «Редактор» canvas id. */
    editorCanvasId?: string;
    /** Shell tab «Игра» canvas id. */
    gameCanvasId?: string;
    /** @deprecated Prefer {@link editorCanvasId}. */
    canvasId?: string;
    canvasContainer?: HTMLElement | null;
    backgroundColor?: THREE.ColorRepresentation;
    showGrid?: boolean;
    showAxes?: boolean;
    gridSize?: number;
    gridDivisions?: number;
}

/**
 * Two WebGL surfaces (editor vs game tab), one ECS scene: {@link worldRoot} is shared;
 * {@link editorOverlayRoot} is hidden for the game viewport pass.
 */
export class ThreeRenderContext {
    private scene?: THREE.Scene;
    private editorCanvas?: HTMLCanvasElement;
    private gameCanvas?: HTMLCanvasElement;
    private editorRenderer?: THREE.WebGLRenderer;
    private gameRenderer?: THREE.WebGLRenderer;
    private activeCamera?: THREE.Camera;
    private readonly worldRoot = new THREE.Group();
    /**
     * Selection outlines + optional tooling; hidden when rendering {@link renderGameViewport}.
     */
    private readonly editorOverlayRoot = new THREE.Group();
    /** Grid / axes — child of {@link editorOverlayRoot}. */
    private readonly editorChromeRoot = new THREE.Group();
    /** Editor-only THREE objects (selection outlines); not serialized with game world. */
    private readonly editorRoot = new THREE.Group();
    private editorViewCamera?: THREE.PerspectiveCamera;
    private gridHelper?: THREE.GridHelper;
    private axesHelper?: THREE.AxesHelper;
    /**
     * Editor viewport: render through this ECS `Camera` entity, or `null` for the free
     * {@link getEditorViewCamera}. Entity pose is driven by ECS (orbit/fly are disabled for ECS cameras).
     */
    private editorRenderCameraEid: number | null = null;
    /** Owned clone for {@link setSceneBackgroundTexture}; disposed on reset / dispose. */
    private sceneBackgroundTexture?: THREE.Texture;

    /** Invoked immediately before the editor viewport draws (after ECS systems). */
    private readonly beforeRenderHooks: Array<() => void> = [];

    constructor(private readonly options: ThreePluginOptions = {}) {
        this.worldRoot.name = "HeliosWorldRoot";
        this.editorOverlayRoot.name = "HeliosEditorOverlay";
        this.editorChromeRoot.name = "HeliosEditorChrome";
        this.editorRoot.name = "HeliosEditorRoot";
    }

    init(): void {
        if (this.scene && this.editorRenderer && this.gameRenderer) {
            return;
        }

        const editorCanvas = this.resolveEditorCanvas();
        const gameCanvas = this.resolveGameCanvas();
        if (!editorCanvas || !gameCanvas) {
            throw new Error(
                "[ThreeRenderContext] Both editor and game canvases are required (ids helios-editor-view / helios-game-view or ThreePluginOptions).",
            );
        }

        this.editorCanvas = editorCanvas;
        this.gameCanvas = gameCanvas;

        this.scene = new THREE.Scene();
        this.scene.background = new Color(this.options.backgroundColor ?? 0x333333);

        this.scene.add(this.worldRoot);

        this.editorOverlayRoot.add(this.editorRoot);
        this.editorOverlayRoot.add(this.editorChromeRoot);
        this.scene.add(this.editorOverlayRoot);

        this.editorRenderer = new THREE.WebGLRenderer({ canvas: editorCanvas, antialias: true });
        this.gameRenderer = new THREE.WebGLRenderer({ canvas: gameCanvas, antialias: true });
        this.syncEditorViewportSize();
        this.syncGameViewportSize();
        this.attachHelpers();
    }

    syncEditorViewportSize(): void {
        if (!this.editorRenderer || !this.editorCanvas) {
            return;
        }

        const width = Math.max(1, this.editorCanvas.clientWidth || window.innerWidth);
        const height = Math.max(1, this.editorCanvas.clientHeight || window.innerHeight);

        if (this.editorCanvas.width !== width || this.editorCanvas.height !== height) {
            this.editorRenderer.setSize(width, height, false);
        }

        this.editorRenderer.setPixelRatio(window.devicePixelRatio);

        const aspect = width / height;
        const ec = this.editorViewCamera;
        if (ec) {
            ec.aspect = aspect;
            ec.updateProjectionMatrix();
        }
    }

    syncGameViewportSize(): void {
        if (!this.gameRenderer || !this.gameCanvas) {
            return;
        }

        const width = Math.max(1, this.gameCanvas.clientWidth || 1);
        const height = Math.max(1, this.gameCanvas.clientHeight || 1);

        if (this.gameCanvas.width !== width || this.gameCanvas.height !== height) {
            this.gameRenderer.setSize(width, height, false);
        }

        this.gameRenderer.setPixelRatio(window.devicePixelRatio);
    }

    getScene(): THREE.Scene {
        if (!this.scene) {
            throw new Error("[ThreeRenderContext] Scene has not been initialized.");
        }

        return this.scene;
    }

    /** @deprecated Use {@link getEditorRenderer} */
    getRenderer(): THREE.WebGLRenderer {
        return this.getEditorRenderer();
    }

    getEditorRenderer(): THREE.WebGLRenderer {
        if (!this.editorRenderer) {
            throw new Error("[ThreeRenderContext] Editor renderer has not been initialized.");
        }

        return this.editorRenderer;
    }

    getGameRenderer(): THREE.WebGLRenderer {
        if (!this.gameRenderer) {
            throw new Error("[ThreeRenderContext] Game renderer has not been initialized.");
        }

        return this.gameRenderer;
    }

    /** Canvas for the «Редактор» tab (orbit, picking, gizmo). */
    getCanvas(): HTMLCanvasElement | undefined {
        return this.editorCanvas;
    }

    /** Canvas for the «Игра» tab (ECS camera, game input). */
    getGameCanvas(): HTMLCanvasElement | undefined {
        return this.gameCanvas;
    }

    /** Parent for grid, axes, and {@link getEditorRoot}; hide for game-tab GPU pass. */
    getEditorOverlayRoot(): THREE.Group {
        return this.editorOverlayRoot;
    }

    getWorldRoot(): THREE.Group {
        return this.worldRoot;
    }

    /** THREE group for editor-only overlays (selection); parent is {@link getEditorOverlayRoot}. */
    getEditorRoot(): THREE.Group {
        return this.editorRoot;
    }

    /**
     * Toggle default scene helpers (grid, axes) on the editor viewport.
     */
    setSceneHelpersVisible(visible: boolean): void {
        if (this.gridHelper) {
            this.gridHelper.visible = visible;
        }
        if (this.axesHelper) {
            this.axesHelper.visible = visible;
        }
    }

    getEditorViewCamera(): THREE.PerspectiveCamera {
        if (!this.editorViewCamera) {
            const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 5000);
            cam.position.set(12, 9, 12);
            cam.rotation.order = "YXZ";
            cam.rotation.set(-0.42, 0.75, 0);
            this.editorViewCamera = cam;
            this.syncEditorViewportSize();
        }
        return this.editorViewCamera;
    }

    getEditorRenderCameraEid(): number | null {
        return this.editorRenderCameraEid;
    }

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
        if (!hasComponent(world, Camera as any, eid) || !hasComponent(world, ThreeObject as any, eid)) {
            return undefined;
        }
        const obj = ThreeObject.get(eid).object;
        return obj instanceof THREE.PerspectiveCamera ? obj : undefined;
    }

    /**
     * Camera for the editor tab: ECS preview entity or free orbit camera.
     */
    resolveEditorViewportCamera(world: IWorld): THREE.Camera | undefined {
        if (this.editorRenderCameraEid !== null) {
            const ecsCam = this.tryResolveEditorEcsCamera(world);
            if (ecsCam) {
                return ecsCam;
            }
            this.editorRenderCameraEid = null;
        }
        return this.getEditorViewCamera();
    }

    /**
     * @deprecated Use {@link resolveEditorViewportCamera}. Kept for in-repo migration.
     */
    resolveRenderCamera(world: IWorld): THREE.Camera | undefined {
        return this.resolveEditorViewportCamera(world);
    }

    setActiveCamera(camera?: THREE.Camera): void {
        this.activeCamera = camera;
    }

    getActiveCamera(): THREE.Camera | undefined {
        return this.activeCamera;
    }

    /** Equirectangular panorama as `scene.background` (editor + game pass). */
    setSceneBackgroundTexture(texture: THREE.Texture, options?: { hdr?: boolean }): void {
        this.disposeSceneBackgroundTexture();
        texture.mapping = THREE.EquirectangularReflectionMapping;
        if (!options?.hdr) {
            texture.colorSpace = THREE.SRGBColorSpace;
        }
        texture.needsUpdate = true;
        this.sceneBackgroundTexture = texture;
        if (this.scene) {
            this.scene.background = texture;
        }
    }

    /** Restore solid {@link ThreePluginOptions.backgroundColor}. */
    resetSceneBackground(): void {
        this.disposeSceneBackgroundTexture();
        if (this.scene) {
            this.scene.background = new Color(this.options.backgroundColor ?? 0x333333);
        }
    }

    private disposeSceneBackgroundTexture(): void {
        if (this.sceneBackgroundTexture) {
            this.sceneBackgroundTexture.dispose();
            this.sceneBackgroundTexture = undefined;
        }
    }

    registerBeforeRender(callback: () => void): () => void {
        this.beforeRenderHooks.push(callback);
        return () => {
            const i = this.beforeRenderHooks.indexOf(callback);
            if (i >= 0) {
                this.beforeRenderHooks.splice(i, 1);
            }
        };
    }

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

    /** Editor tab pass: full scene including editor overlay chrome. */
    renderEditorViewport(world: IWorld): void {
        if (!this.scene || !this.editorRenderer) {
            return;
        }
        this.editorOverlayRoot.visible = true;

        const camera = this.resolveEditorViewportCamera(world);
        if (!camera) {
            return;
        }

        this.syncEditorViewportSize();
        this.invokeBeforeRender();
        this.editorRenderer.render(this.scene, camera);
    }

    /** Game tab pass: world content only (overlay hidden). */
    renderGameViewport(): void {
        if (!this.scene || !this.gameRenderer || !this.gameCanvas) {
            return;
        }

        this.editorOverlayRoot.visible = false;
        try {
            const cam = this.activeCamera;
            this.syncGameViewportSize();

            if (!cam) {
                this.gameRenderer.clear();
                return;
            }

            if (cam instanceof THREE.PerspectiveCamera) {
                const w = Math.max(1, this.gameCanvas.clientWidth || 1);
                const h = Math.max(1, this.gameCanvas.clientHeight || 1);
                cam.aspect = w / h;
                cam.updateProjectionMatrix();
            }

            this.gameRenderer.render(this.scene, cam);
        } finally {
            this.editorOverlayRoot.visible = true;
        }
    }

    dispose(): void {
        this.disposeSceneBackgroundTexture();
        this.editorRenderCameraEid = null;
        this.beforeRenderHooks.length = 0;
        this.editorRoot.clear();
        this.editorChromeRoot.clear();
        this.editorOverlayRoot.clear();
        this.editorOverlayRoot.removeFromParent();
        this.editorViewCamera = undefined;

        this.worldRoot.clear();
        this.axesHelper?.removeFromParent();
        this.gridHelper?.removeFromParent();
        this.axesHelper = undefined;
        this.gridHelper = undefined;

        this.editorRenderer?.dispose();
        this.gameRenderer?.dispose();
        this.editorRenderer = undefined;
        this.gameRenderer = undefined;
        this.activeCamera = undefined;
    }

    private resolveEditorCanvas(): HTMLCanvasElement | null {
        const canvasId = this.options.editorCanvasId ?? this.options.canvasId ?? "helios-editor-view";
        const byId = document.getElementById(canvasId);

        if (byId instanceof HTMLCanvasElement) {
            return byId;
        }

        if (!this.options.canvasContainer) {
            return null;
        }

        const existing = this.options.canvasContainer.querySelector(`#${canvasId}`) ??
            this.options.canvasContainer.querySelector(".helios-editor-canvas") ??
            this.options.canvasContainer.querySelector("canvas");

        if (existing instanceof HTMLCanvasElement) {
            return existing;
        }

        const canvas = document.createElement("canvas");
        canvas.id = canvasId;
        canvas.classList.add("helios-editor-canvas");
        this.options.canvasContainer.appendChild(canvas);
        return canvas;
    }

    private resolveGameCanvas(): HTMLCanvasElement | null {
        const canvasId = this.options.gameCanvasId ?? "helios-game-view";
        const byId = document.getElementById(canvasId);

        if (byId instanceof HTMLCanvasElement) {
            return byId;
        }

        if (!this.options.canvasContainer) {
            return null;
        }

        const existing = this.options.canvasContainer.querySelector(`#${canvasId}`);
        if (existing instanceof HTMLCanvasElement) {
            return existing;
        }

        const canvas = document.createElement("canvas");
        canvas.id = canvasId;
        canvas.classList.add("helios-game-canvas");
        this.options.canvasContainer.appendChild(canvas);
        return canvas;
    }

    private attachHelpers(): void {
        const chrome = this.editorChromeRoot;

        if (this.options.showGrid ?? true) {
            this.gridHelper = new GridHelper(
                this.options.gridSize ?? 1000,
                this.options.gridDivisions ?? 1000,
                new Color(0x666666),
                new Color(0x444444),
            );
            this.gridHelper.position.y = -0.001;
            chrome.add(this.gridHelper);
        }

        if (this.options.showAxes ?? true) {
            this.axesHelper = new AxesHelper(2.5);
            chrome.add(this.axesHelper);
        }
    }
}

export function getThreeRenderContext(context: Context): ThreeRenderContext {
    return context.capabilities.get<ThreeRenderContext>(THREE_RENDERER_CAPABILITY);
}

export function clearThreeRenderContext(context: Context): void {
    context.capabilities.delete(THREE_RENDERER_CAPABILITY);
}
