import type { Engine, EngineAPI } from "@merlinn/helios-core";
import {
    THREE_RENDERER_CAPABILITY,
    tryGetEntityThreeObject,
    type ThreeRenderContext,
} from "@merlinn/helios-three-plugin";
import * as THREE from "three";
import { HeliosTransformControls } from "./HeliosTransformControls";
import type { ISelectionBus, SelectionEid } from "../selection/SelectionBus";
import type { CompositeViewportPointerGate } from "../viewport/CompositeViewportPointerGate";
import type { IEditorViewportNavigation } from "../viewport/IEditorViewportNavigation";
import type { IViewportPointerGate } from "../viewport/IViewportPointerGate";
import type { ViewportPickContext } from "../viewport/ViewportPickContext";
import { writeEcsTransformFromObject3D } from "./writeEcsTransformFromObject3D";
import type { ITransformToolController, TransformToolMode } from "./ITransformToolController";

/** Smaller than three.js default (1) so handles do not dominate the viewport. */
const EDITOR_TRANSFORM_GIZMO_SIZE = 0.52;

/** Transparency tuning for recolored transform gizmo materials (planes and tinted handles). */
const EDITOR_TRANSFORM_GIZMO_OPACITY = {
    /** Multiplier applied to three.js default opacities on semi-transparent axis materials. */
    factor: 0.62,
    /** Lower and upper clamp after multiplying source opacity by `factor`. */
    min: 0.12,
    max: 0.82,
    /** Only materials with opacity ≥ this are adjusted (skips nearly invisible pick proxies). */
    minSourceOpacity: 0.2,
} as const;

/**
 * Soften stock {@link TransformControls} axis colors and semi-transparent plane opacities.
 */
function softenTransformControlsHelperMaterials(root: THREE.Object3D): void {
    const seen = new Set<THREE.Material>();
    root.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh) && !(obj instanceof THREE.Line) && !(obj instanceof THREE.LineSegments)) {
            return;
        }
        const raw = obj.material;
        const list: THREE.Material[] = Array.isArray(raw) ? [...raw] : raw ? [raw] : [];
        for (const m of list) {
            if (!m || seen.has(m)) {
                continue;
            }
            seen.add(m);
            if (!(m instanceof THREE.MeshBasicMaterial) && !(m instanceof THREE.LineBasicMaterial)) {
                continue;
            }
            const hex = m.color.getHex();
            const replacement =
                hex === 0xff0000
                    ? 0xd68888
                    : hex === 0x00ff00
                      ? 0x75c275
                      : hex === 0x0000ff
                        ? 0x7aa3d8
                        : hex === 0xffff00
                          ? 0xc9b866
                          : hex === 0x787878
                            ? 0x9498a5
                            : null;
            if (replacement !== null) {
                m.color.setHex(replacement);
            }
            if (
                replacement !== null &&
                m.transparent &&
                typeof m.opacity === "number" &&
                m.opacity >= EDITOR_TRANSFORM_GIZMO_OPACITY.minSourceOpacity
            ) {
                m.opacity = THREE.MathUtils.clamp(
                    m.opacity * EDITOR_TRANSFORM_GIZMO_OPACITY.factor,
                    EDITOR_TRANSFORM_GIZMO_OPACITY.min,
                    EDITOR_TRANSFORM_GIZMO_OPACITY.max,
                );
            }
        }
    });
}

/**
 * Viewport translate/rotate/scale manipulator backed by three.js {@link TransformControls}.
 * Writes transforms into ECS ({@link writeEcsTransformFromObject3D}); registers a
 * {@link IViewportPointerGate} so LMB entity picking yields when a gizmo handle is hovered.
 */
export class EditorTransformManipulator implements ITransformToolController {
    private engine: Engine | null = null;
    private renderContext: ThreeRenderContext | null = null;
    private transformControls: HeliosTransformControls | null = null;
    private canvas: HTMLCanvasElement | null = null;

    /** When true, gizmo stays detached (game viewport uses LMB for something else). */
    private gameViewportActive = false;

    private selectionUnsub: (() => void) | null = null;
    private unregisterGate: (() => void) | null = null;
    private unregisterBeforeRender: (() => void) | null = null;

    private gizmoUiVisible = true;

    private readonly toolListeners = new Set<() => void>();

    private readonly pickGate: IViewportPointerGate = {
        shouldSuppressEntityPickCapture: (e, ctx) => this.shouldSuppressEntityPickCapture(e, ctx),
    };

    private readonly boundDraggingChanged = (ev: { value?: unknown }): void => {
        if (ev.value === true) {
            this.navigation.setSceneNavigationEnabled(false);
        } else if (ev.value === false) {
            this.navigation.setSceneNavigationEnabled(true);
        }
    };

    private readonly boundObjectChange = (): void => {
        const engine = this.engine;
        const tc = this.transformControls;
        if (!engine || !tc?.object) {
            return;
        }
        const eid = this.selection.get();
        if (eid === null) {
            return;
        }
        writeEcsTransformFromObject3D(this.api, eid, tc.object);
    };

    private readonly boundKeyDown = (e: KeyboardEvent): void => {
        if (this.navigation.isFlyActive()) {
            return;
        }
        if (isEditableFieldTarget(e.target)) {
            return;
        }
        const tc = this.transformControls;
        if (!tc || tc.object === undefined) {
            return;
        }
        switch (e.code) {
            case "KeyQ":
                this.gizmoUiVisible = !this.gizmoUiVisible;
                this.applyGizmoUiVisibility();
                e.preventDefault();
                this.notifyToolListeners();
                break;
            case "KeyW":
                this.gizmoUiVisible = true;
                tc.setMode("translate");
                this.applyGizmoUiVisibility();
                e.preventDefault();
                this.notifyToolListeners();
                break;
            case "KeyE":
                this.gizmoUiVisible = true;
                tc.setMode("rotate");
                this.applyGizmoUiVisibility();
                e.preventDefault();
                this.notifyToolListeners();
                break;
            case "KeyR":
                this.gizmoUiVisible = true;
                tc.setMode("scale");
                this.applyGizmoUiVisibility();
                e.preventDefault();
                this.notifyToolListeners();
                break;
            default:
                break;
        }
    };

    constructor(
        private readonly api: EngineAPI,
        private readonly selection: ISelectionBus,
        private readonly pointerGate: CompositeViewportPointerGate,
        private readonly navigation: IEditorViewportNavigation,
    ) {}

    /** Detach gizmo while the shell is in game viewport mode (LMB not for ECS picking). */
    setGameViewportActive(active: boolean): void {
        this.gameViewportActive = active;
        if (active) {
            const tc = this.transformControls;
            if (tc && tc.object !== undefined) {
                tc.detach();
                this.applyGizmoUiVisibility();
                this.notifyToolListeners();
            }
        } else {
            this.syncTransformControlsToSelection();
        }
    }

    attach(engine: Engine): void {
        this.detach();

        this.engine = engine;
        const rc = engine.context.capabilities.get<ThreeRenderContext>(THREE_RENDERER_CAPABILITY);
        if (!rc) {
            this.engine = null;
            return;
        }
        this.renderContext = rc;
        const canvas = rc.getCanvas();
        if (!canvas) {
            this.engine = null;
            this.renderContext = null;
            return;
        }
        this.canvas = canvas;

        const world = engine.context.ecsWorld;
        const camera = rc.resolveEditorViewportCamera(world);
        if (!(camera instanceof THREE.PerspectiveCamera)) {
            this.detachPartial();
            return;
        }

        const tc = new HeliosTransformControls(camera, canvas);
        tc.setSpace("world");
        tc.setSize(EDITOR_TRANSFORM_GIZMO_SIZE);
        tc.addEventListener("dragging-changed", this.boundDraggingChanged as (e: unknown) => void);
        tc.addEventListener("objectChange", this.boundObjectChange);

        this.transformControls = tc;
        const helper = tc.getHelper();
        softenTransformControlsHelperMaterials(helper);
        rc.getEditorOverlayRoot().add(helper);

        this.unregisterGate = this.pointerGate.register(this.pickGate, -100);

        this.selectionUnsub = this.selection.subscribe((eid) => {
            this.applySelection(eid);
        });

        window.addEventListener("keydown", this.boundKeyDown);

        this.unregisterBeforeRender = rc.registerBeforeRender(() => {
            this.syncCameraToControls();
            this.syncTransformControlsToSelection();
        });
        this.notifyToolListeners();
    }

    detach(): void {
        if (this.transformControls?.dragging) {
            this.navigation.setSceneNavigationEnabled(true);
        }

        if (this.unregisterBeforeRender) {
            this.unregisterBeforeRender();
            this.unregisterBeforeRender = null;
        }

        window.removeEventListener("keydown", this.boundKeyDown);

        if (this.selectionUnsub) {
            this.selectionUnsub();
            this.selectionUnsub = null;
        }

        if (this.unregisterGate) {
            this.unregisterGate();
            this.unregisterGate = null;
        }

        const tc = this.transformControls;
        if (tc) {
            tc.removeEventListener("dragging-changed", this.boundDraggingChanged as (e: unknown) => void);
            tc.removeEventListener("objectChange", this.boundObjectChange);
            tc.dispose();
            const helper = tc.getHelper();
            helper.removeFromParent();
        }
        this.transformControls = null;

        this.canvas = null;
        this.renderContext = null;
        this.engine = null;
        this.gizmoUiVisible = true;
        this.notifyToolListeners();
    }

    private detachPartial(): void {
        this.engine = null;
        this.renderContext = null;
        this.canvas = null;
    }

    private syncCameraToControls(): void {
        const engine = this.engine;
        const tc = this.transformControls;
        const rc = this.renderContext;
        if (!engine || !tc || !rc) {
            return;
        }
        const cam = rc.resolveEditorViewportCamera(engine.context.ecsWorld);
        if (cam instanceof THREE.PerspectiveCamera) {
            tc.camera = cam;
        }
    }

    /**
     * After mesh rebuild (e.g. geometry descriptor), `ThreeObject` points at a new `THREE.Mesh`.
     * Re-attach {@link TransformControls} so it never targets an object that left the scene graph.
     */
    private syncTransformControlsToSelection(): void {
        const tc = this.transformControls;
        const engine = this.engine;
        if (!tc || !engine) {
            return;
        }
        if (this.gameViewportActive) {
            if (tc.object !== undefined) {
                tc.detach();
                this.applyGizmoUiVisibility();
                this.notifyToolListeners();
            }
            return;
        }
        const eid = this.selection.get();
        if (eid === null) {
            if (tc.object !== undefined) {
                tc.detach();
                this.applyGizmoUiVisibility();
                this.notifyToolListeners();
            }
            return;
        }
        const obj = tryGetEntityThreeObject(engine.context.ecsWorld, eid);
        if (!obj) {
            if (tc.object !== undefined) {
                tc.detach();
                this.applyGizmoUiVisibility();
                this.notifyToolListeners();
            }
            return;
        }
        const attached = tc.object as THREE.Object3D | undefined;
        if (attached !== obj) {
            tc.setSpace(this.api.hasComponent(eid, "Parent" as never) ? "local" : "world");
            tc.attach(obj);
            this.applyGizmoUiVisibility();
            this.notifyToolListeners();
        }
    }

    private applySelection(eid: SelectionEid): void {
        const tc = this.transformControls;
        const engine = this.engine;
        if (!tc || !engine) {
            return;
        }

        if (this.gameViewportActive) {
            if (tc.object !== undefined) {
                tc.detach();
                this.applyGizmoUiVisibility();
                this.notifyToolListeners();
            }
            return;
        }

        this.gizmoUiVisible = true;

        if (eid === null) {
            tc.detach();
            this.applyGizmoUiVisibility();
            this.notifyToolListeners();
            return;
        }

        const world = engine.context.ecsWorld;
        const obj = tryGetEntityThreeObject(world, eid);
        if (!obj) {
            tc.detach();
            this.applyGizmoUiVisibility();
            this.notifyToolListeners();
            return;
        }

        tc.setSpace(this.api.hasComponent(eid, "Parent" as never) ? "local" : "world");
        tc.attach(obj);
        this.applyGizmoUiVisibility();
        this.notifyToolListeners();
    }

    private applyGizmoUiVisibility(): void {
        const tc = this.transformControls;
        if (!tc) {
            return;
        }
        const hasObject = tc.object !== undefined;
        tc.getHelper().visible = this.gizmoUiVisible && hasObject;
    }

    getMode(): TransformToolMode {
        const m = this.transformControls?.getMode();
        if (m === "rotate" || m === "scale") {
            return m;
        }
        return "translate";
    }

    getGizmoUiVisible(): boolean {
        return this.gizmoUiVisible;
    }

    setMode(mode: TransformToolMode): void {
        if (this.transformControls) {
            this.transformControls.setMode(mode);
        }
        this.gizmoUiVisible = true;
        this.applyGizmoUiVisibility();
        this.notifyToolListeners();
    }

    setGizmoUiVisible(visible: boolean): void {
        this.gizmoUiVisible = visible;
        this.applyGizmoUiVisibility();
        this.notifyToolListeners();
    }

    subscribe(listener: () => void): () => void {
        this.toolListeners.add(listener);
        listener();
        return () => {
            this.toolListeners.delete(listener);
        };
    }

    private notifyToolListeners(): void {
        for (const fn of [...this.toolListeners]) {
            try {
                fn();
            } catch (err) {
                console.error("[EditorTransformManipulator] tool listener failed:", err);
            }
        }
    }

    private shouldSuppressEntityPickCapture(e: PointerEvent, _ctx: ViewportPickContext): boolean {
        if (this.gameViewportActive) {
            return false;
        }
        if (e.button !== 0 || e.altKey) {
            return false;
        }
        const tc = this.transformControls;
        if (!tc || tc.object === undefined || !this.gizmoUiVisible) {
            return false;
        }
        this.syncCameraToControls();
        const canvas = this.canvas;
        if (!canvas) {
            return false;
        }
        const rect = canvas.getBoundingClientRect();
        const pointerLike = {
            x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
            y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
            button: e.button,
        } as unknown as PointerEvent;
        tc.pointerHover(pointerLike);
        return tc.axis !== null;
    }
}

function isEditableFieldTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }
    return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}
