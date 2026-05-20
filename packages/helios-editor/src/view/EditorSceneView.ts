import type { Engine } from "@merlinn/helios-core";
import { THREE_RENDERER_CAPABILITY, type ThreeRenderContext } from "@merlinn/helios-three-plugin";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { ISelectionBus } from "../selection/SelectionBus";
import {
    GAME_VIEWPORT_POINTER_SINK_CAPABILITY,
    type IGameViewportPointerSink,
} from "../viewport/GameViewportPointerSink";
import type { EditorViewportInteractionMode } from "../viewport/EditorViewportInteractionMode";
import { createViewportPickContext } from "../viewport/ViewportPickContext";
import type { IEditorViewportNavigation } from "../viewport/IEditorViewportNavigation";
import type { IViewportPointerGate } from "../viewport/IViewportPointerGate";
import { pickEntityAtCanvasPoint } from "./picking/pickEntityAtCanvasPoint";
import {
    type SceneNavigationPolicy,
    UnityLikeSceneNavigationPolicy,
} from "./picking/SceneNavigationPolicy";

const FLY_MOVE_SPEED = 6;
const FLY_SHIFT_SPEED_MULT = 3;
const FLY_LOOK_SENS = 0.0025;
const FLY_MAX_PITCH = Math.PI / 2 - 0.02;

const FLY_CODES = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE"]);

/**
 * Wires an editor-only orbit camera to {@link ThreeRenderContext} (not ECS, not `worldRoot`).
 *
 * **Unity-like scene controls:** LMB ray-picks entities (see `pickEntityAtCanvasPoint`); **Alt+LMB** and
 * **MMB** orbit; **RMB** fly (WASD + look). OrbitControls does not use RMB so fly keeps priority.
 */
export class EditorSceneView implements IEditorViewportNavigation {
    private engine: Engine | null = null;
    private renderContext: ThreeRenderContext | null = null;
    private controls: OrbitControls | null = null;
    private camera: THREE.PerspectiveCamera | null = null;
    private canvas: HTMLCanvasElement | null = null;
    /** Game tab canvas — LMB forwarded to {@link GAME_VIEWPORT_POINTER_SINK_CAPABILITY}. */
    private gameCanvas: HTMLCanvasElement | null = null;
    private rafId = 0;
    /** Last camera returned by {@link ThreeRenderContext.resolveEditorViewportCamera} (orbit vs ECS preview). */
    private lastResolvedRenderCamera: THREE.Camera | undefined = undefined;

    private flyActive = false;
    private readonly keysDown = new Set<string>();
    private shiftHeld = false;
    private altHeld = false;
    private lastTickTime = 0;

    /** Nested requests to keep orbit off (gizmo drag, future tools). Fly mode overrides separately. */
    private sceneNavigationHoldCount = 0;

    private readonly navigationPolicy: SceneNavigationPolicy;

    private interactionMode: EditorViewportInteractionMode = "editor";

    /** Full 3D view direction (for orbit sync). */
    private readonly tmpViewDir = new THREE.Vector3();
    /** Horizontal (XZ) forward for W/S — Unity fly on the ground plane. */
    private readonly tmpForward = new THREE.Vector3();
    private readonly tmpRight = new THREE.Vector3();
    private readonly tmpMove = new THREE.Vector3();
    private readonly tmpWorldUp = new THREE.Vector3(0, 1, 0);
    private readonly tmpEuler = new THREE.Euler();

    private boundCtxMenu!: (e: Event) => void;
    private boundPickPointerDown!: (e: PointerEvent) => void;
    private boundPickPointerMove!: (e: PointerEvent) => void;
    private boundPickPointerHover!: (e: PointerEvent) => void;
    private boundPickPointerLeave!: (e: PointerEvent) => void;
    private boundPointerDown!: (e: PointerEvent) => void;
    private boundPointerUp!: (e: PointerEvent) => void;
    private boundPointerMove!: (e: PointerEvent) => void;
    private boundKeyDown!: (e: KeyboardEvent) => void;
    private boundKeyUp!: (e: KeyboardEvent) => void;
    private boundBlur!: () => void;

    constructor(
        private readonly selection: ISelectionBus,
        navigationPolicy?: SceneNavigationPolicy,
        private readonly pointerGate?: IViewportPointerGate,
    ) {
        this.navigationPolicy = navigationPolicy ?? new UnityLikeSceneNavigationPolicy();
    }

    /** Entity picking (LMB) vs forwarding to {@link GAME_VIEWPORT_POINTER_SINK_CAPABILITY} in game mode. */
    setInteractionMode(mode: EditorViewportInteractionMode): void {
        this.interactionMode = mode;
        if (mode === "game") {
            this.endFly();
        }
        this.applyOrbitEnabled();
    }

    getInteractionMode(): EditorViewportInteractionMode {
        return this.interactionMode;
    }

    /** @inheritdoc */
    setSceneNavigationEnabled(enabled: boolean): void {
        if (enabled) {
            this.sceneNavigationHoldCount = Math.max(0, this.sceneNavigationHoldCount - 1);
        } else {
            this.sceneNavigationHoldCount++;
        }
        this.applyOrbitEnabled();
    }

    /** @inheritdoc */
    isFlyActive(): boolean {
        return this.flyActive;
    }

    private applyOrbitEnabled(): void {
        if (!this.controls) {
            return;
        }
        const allow =
            this.interactionMode !== "game" && !this.flyActive && this.sceneNavigationHoldCount === 0;
        this.controls.enabled = allow;
    }

    attach(engine: Engine): void {
        this.detach();

        const rc = engine.context.capabilities.get<ThreeRenderContext>(THREE_RENDERER_CAPABILITY);
        this.engine = engine;
        this.renderContext = rc;

        const canvas = rc.getCanvas();
        if (!canvas) {
            throw new Error("[EditorSceneView] Three canvas is not available yet.");
        }
        this.canvas = canvas;
        this.gameCanvas = rc.getGameCanvas() ?? null;

        this.lastResolvedRenderCamera = undefined;
        this.ensureControlsMatchRenderCamera();

        this.boundCtxMenu = (e: Event) => e.preventDefault();
        this.boundPickPointerDown = this.onPickPointerDownCapture.bind(this);
        this.boundPickPointerMove = this.onPickPointerMoveCapture.bind(this);
        this.boundPickPointerHover = this.onPickPointerHover.bind(this);
        this.boundPickPointerLeave = this.onPickPointerLeave.bind(this);
        this.boundPointerDown = this.onPointerDown.bind(this);
        this.boundPointerUp = this.onPointerUp.bind(this);
        this.boundPointerMove = this.onPointerMove.bind(this);
        this.boundKeyDown = this.onKeyDown.bind(this);
        this.boundKeyUp = this.onKeyUp.bind(this);
        this.boundBlur = this.onWindowBlur.bind(this);

        canvas.addEventListener("pointerdown", this.boundPickPointerDown, true);
        if (this.gameCanvas) {
            this.gameCanvas.addEventListener("pointerdown", this.boundPickPointerDown, true);
            this.gameCanvas.addEventListener("pointermove", this.boundPickPointerMove, true);
            this.gameCanvas.addEventListener("pointermove", this.boundPickPointerHover);
            this.gameCanvas.addEventListener("pointerleave", this.boundPickPointerLeave);
        }
        canvas.addEventListener("contextmenu", this.boundCtxMenu);
        canvas.addEventListener("pointerdown", this.boundPointerDown);
        canvas.addEventListener("pointerup", this.boundPointerUp);
        canvas.addEventListener("pointermove", this.boundPointerMove);
        window.addEventListener("keydown", this.boundKeyDown);
        window.addEventListener("keyup", this.boundKeyUp);
        window.addEventListener("blur", this.boundBlur);

        this.lastTickTime = performance.now();
        const tick = (): void => {
            this.rafId = requestAnimationFrame(tick);
            this.ensureControlsMatchRenderCamera();
            const now = performance.now();
            const dt = Math.min(0.05, Math.max(0, (now - this.lastTickTime) / 1000));
            this.lastTickTime = now;

            if (this.interactionMode !== "game" && this.flyActive && this.camera && this.isFreeEditorCamera()) {
                this.applyFlyMove(dt);
            } else if (this.interactionMode !== "game") {
                this.controls?.update();
            }
        };
        this.rafId = requestAnimationFrame(tick);
    }

    private isFreeEditorCamera(): boolean {
        if (!this.renderContext || !this.camera) {
            return false;
        }
        return this.camera === this.renderContext.getEditorViewCamera();
    }

    /**
     * Orbit + fly stay on the free editor camera. When the viewport renders an ECS scene camera,
     * pose comes from simulation — orbit/fly are disabled so ECS updates are not overwritten.
     */
    private ensureControlsMatchRenderCamera(): void {
        if (!this.renderContext || !this.engine || !this.canvas) {
            return;
        }
        const world = this.engine.context.ecsWorld;
        const resolved = this.renderContext.resolveEditorViewportCamera(world);
        if (!resolved || !(resolved instanceof THREE.PerspectiveCamera)) {
            return;
        }
        if (resolved === this.lastResolvedRenderCamera) {
            return;
        }
        this.lastResolvedRenderCamera = resolved;

        this.shiftHeld = false;
        this.endFly();

        this.controls?.dispose();
        this.controls = null;
        this.camera = resolved;

        const editorFree = this.renderContext.getEditorViewCamera();
        if (resolved === editorFree) {
            editorFree.rotation.order = "YXZ";
            const controls = new OrbitControls(editorFree, this.canvas);
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;
            editorFree.getWorldDirection(this.tmpViewDir);
            controls.target.copy(editorFree.position).addScaledVector(this.tmpViewDir, 8);
            this.controls = controls;
            this.applyOrbitMouseButtons();
            this.applyOrbitEnabled();
        }
    }

    /** Unity-like: LMB only orbits when Alt is held; MMB orbits; RMB unused by OrbitControls (fly). */
    private applyOrbitMouseButtons(): void {
        const c = this.controls;
        if (!c) {
            return;
        }
        const left = this.navigationPolicy.orbitLeftMouseEnabled(this.altHeld)
            ? THREE.MOUSE.ROTATE
            : undefined;
        (c as unknown as { mouseButtons: Record<string, number | undefined> }).mouseButtons = {
            LEFT: left,
            MIDDLE: THREE.MOUSE.ROTATE,
            RIGHT: undefined,
        };
    }

    private syncAltFromKeyboardEvent(e: KeyboardEvent): void {
        const next = e.getModifierState("Alt");
        if (next === this.altHeld) {
            return;
        }
        this.altHeld = next;
        this.applyOrbitMouseButtons();
    }

    /**
     * Capture phase: LMB without Alt selects/deselects before OrbitControls sees the event.
     */
    private onPickPointerDownCapture(e: PointerEvent): void {
        if (e.button !== 0) {
            return;
        }
        if (e.altKey) {
            return;
        }
        if (this.flyActive) {
            return;
        }
        if (!this.engine || !this.canvas) {
            return;
        }
        const eventCanvas = e.currentTarget as HTMLCanvasElement;
        if (this.interactionMode === "game") {
            if (this.gameCanvas && eventCanvas !== this.gameCanvas) {
                return;
            }
            const sinkCanvas = this.gameCanvas ?? this.canvas;
            const sink = this.engine.context.capabilities.getOrUndefined<IGameViewportPointerSink>(
                GAME_VIEWPORT_POINTER_SINK_CAPABILITY,
            );
            const handled = sink ? sink.tryHandlePointerDown(this.engine, sinkCanvas, e) : true;
            if (handled) {
                e.preventDefault();
                e.stopImmediatePropagation();
                try {
                    sinkCanvas.setPointerCapture(e.pointerId);
                } catch {
                    // ignore
                }
            }
            return;
        }
        if (eventCanvas !== this.canvas) {
            return;
        }
        if (this.pointerGate) {
            const ctx = createViewportPickContext(this.engine, this.canvas);
            if (ctx && this.pointerGate.shouldSuppressEntityPickCapture(e, ctx)) {
                return;
            }
        }
        const eid = pickEntityAtCanvasPoint(this.engine, this.canvas, e.clientX, e.clientY);
        this.selection.set(eid);
        e.preventDefault();
        e.stopImmediatePropagation();
    }

    /** Game view: hover preview (no preventDefault — keeps RMB look working). */
    private onPickPointerHover(e: PointerEvent): void {
        if ((e.buttons & 1) !== 0) {
            return;
        }
        if (!this.engine || !this.gameCanvas || this.interactionMode !== "game") {
            return;
        }
        if (e.currentTarget !== this.gameCanvas) {
            return;
        }
        const sink = this.engine.context.capabilities.getOrUndefined<IGameViewportPointerSink>(
            GAME_VIEWPORT_POINTER_SINK_CAPABILITY,
        );
        sink?.tryHandlePointerHover?.(this.engine, this.gameCanvas, e);
    }

    private onPickPointerLeave(e: PointerEvent): void {
        if (!this.engine || !this.gameCanvas || this.interactionMode !== "game") {
            return;
        }
        const sink = this.engine.context.capabilities.getOrUndefined<IGameViewportPointerSink>(
            GAME_VIEWPORT_POINTER_SINK_CAPABILITY,
        );
        sink?.tryHandlePointerLeave?.(this.engine, this.gameCanvas);
    }

    /** Game view: forward LMB drag to {@link IGameViewportPointerSink.tryHandlePointerMove}. */
    private onPickPointerMoveCapture(e: PointerEvent): void {
        if ((e.buttons & 1) === 0) {
            return;
        }
        if (e.altKey || this.flyActive || !this.engine || !this.gameCanvas) {
            return;
        }
        if (this.interactionMode !== "game") {
            return;
        }
        if (e.currentTarget !== this.gameCanvas) {
            return;
        }
        const sink = this.engine.context.capabilities.getOrUndefined<IGameViewportPointerSink>(
            GAME_VIEWPORT_POINTER_SINK_CAPABILITY,
        );
        if (!sink?.tryHandlePointerMove) {
            return;
        }
        const handled = sink.tryHandlePointerMove(this.engine, this.gameCanvas, e);
        if (handled) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }

    private onPointerDown(e: PointerEvent): void {
        if (this.interactionMode === "game") {
            return;
        }
        if (e.button !== 2 || !this.controls || !this.camera || !this.canvas || !this.isFreeEditorCamera()) return;
        this.flyActive = true;
        this.applyOrbitEnabled();
        try {
            this.canvas.setPointerCapture(e.pointerId);
        } catch {
            // ignore
        }
    }

    private onPointerUp(e: PointerEvent): void {
        if (this.interactionMode === "game") {
            return;
        }
        if (e.button !== 2 || !this.controls || !this.camera || !this.canvas || !this.isFreeEditorCamera()) return;
        this.endFly();
        try {
            this.canvas.releasePointerCapture(e.pointerId);
        } catch {
            // ignore
        }
        this.syncOrbitTargetToView();
    }

    private endFly(): void {
        if (!this.flyActive) return;
        this.flyActive = false;
        this.keysDown.clear();
        this.applyOrbitEnabled();
    }

    /** After fly, keep orbit pivot in front of the camera so orbit does not jump. */
    private syncOrbitTargetToView(): void {
        if (!this.controls || !this.camera) return;
        this.camera.getWorldDirection(this.tmpViewDir);
        this.controls.target.copy(this.camera.position).addScaledVector(this.tmpViewDir, 5);
    }

    private onPointerMove(e: PointerEvent): void {
        if (this.interactionMode === "game") {
            return;
        }
        if (!this.flyActive || !this.camera || !this.isFreeEditorCamera() || (e.buttons & 2) === 0) return;

        this.camera.rotation.y -= e.movementX * FLY_LOOK_SENS;
        this.camera.rotation.x -= e.movementY * FLY_LOOK_SENS;
        this.camera.rotation.x = THREE.MathUtils.clamp(this.camera.rotation.x, -FLY_MAX_PITCH, FLY_MAX_PITCH);
    }

    private onWindowBlur(): void {
        this.shiftHeld = false;
        this.altHeld = false;
        this.applyOrbitMouseButtons();
        this.endFly();
    }

    private onKeyDown(e: KeyboardEvent): void {
        this.syncAltFromKeyboardEvent(e);
        if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
            this.shiftHeld = true;
            return;
        }
        if (!this.flyActive || !this.isFreeEditorCamera() || !FLY_CODES.has(e.code) || this.interactionMode === "game")
            return;
        this.keysDown.add(e.code);
        e.preventDefault();
    }

    private onKeyUp(e: KeyboardEvent): void {
        this.syncAltFromKeyboardEvent(e);
        if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
            this.shiftHeld = false;
            return;
        }
        this.keysDown.delete(e.code);
    }

    private applyFlyMove(dt: number): void {
        const cam = this.camera;
        if (!cam || this.keysDown.size === 0) return;

        const speedMult = this.shiftHeld ? FLY_SHIFT_SPEED_MULT : 1;
        const speed = FLY_MOVE_SPEED * dt * speedMult;
        this.tmpMove.set(0, 0, 0);

        cam.getWorldDirection(this.tmpViewDir);

        // Unity-style: W/S along horizontal projection of view (slide on XZ), not full 3D forward.
        this.tmpForward.copy(this.tmpViewDir);
        this.tmpForward.y = 0;
        if (this.tmpForward.lengthSq() < 1e-12) {
            this.tmpEuler.setFromQuaternion(cam.quaternion, "YXZ");
            this.tmpForward.set(-Math.sin(this.tmpEuler.y), 0, -Math.cos(this.tmpEuler.y));
        } else {
            this.tmpForward.normalize();
        }

        // Camera right on the horizontal plane: forward × worldUp (right-hand rule), not up × forward.
        this.tmpRight.crossVectors(this.tmpForward, this.tmpWorldUp);
        if (this.tmpRight.lengthSq() < 1e-12) {
            this.tmpRight.set(1, 0, 0);
        } else {
            this.tmpRight.normalize();
        }

        if (this.keysDown.has("KeyW")) this.tmpMove.addScaledVector(this.tmpForward, speed);
        if (this.keysDown.has("KeyS")) this.tmpMove.addScaledVector(this.tmpForward, -speed);
        if (this.keysDown.has("KeyD")) this.tmpMove.addScaledVector(this.tmpRight, speed);
        if (this.keysDown.has("KeyA")) this.tmpMove.addScaledVector(this.tmpRight, -speed);
        if (this.keysDown.has("KeyE")) this.tmpMove.addScaledVector(this.tmpWorldUp, speed);
        if (this.keysDown.has("KeyQ")) this.tmpMove.addScaledVector(this.tmpWorldUp, -speed);

        cam.position.add(this.tmpMove);
    }

    detach(): void {
        this.shiftHeld = false;
        this.altHeld = false;
        this.endFly();
        this.sceneNavigationHoldCount = 0;

        if (this.canvas) {
            this.canvas.removeEventListener("pointerdown", this.boundPickPointerDown, true);
            this.canvas.removeEventListener("contextmenu", this.boundCtxMenu);
            this.canvas.removeEventListener("pointerdown", this.boundPointerDown);
            this.canvas.removeEventListener("pointerup", this.boundPointerUp);
            this.canvas.removeEventListener("pointermove", this.boundPointerMove);
            this.canvas = null;
        }
        if (this.gameCanvas) {
            this.gameCanvas.removeEventListener("pointerdown", this.boundPickPointerDown, true);
            this.gameCanvas.removeEventListener("pointermove", this.boundPickPointerMove, true);
            this.gameCanvas.removeEventListener("pointermove", this.boundPickPointerHover);
            this.gameCanvas.removeEventListener("pointerleave", this.boundPickPointerLeave);
            this.gameCanvas = null;
        }
        window.removeEventListener("keydown", this.boundKeyDown);
        window.removeEventListener("keyup", this.boundKeyUp);
        window.removeEventListener("blur", this.boundBlur);

        if (this.rafId !== 0) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
        this.controls?.dispose();
        this.controls = null;
        this.camera = null;

        if (this.renderContext) {
            this.renderContext.setEditorRenderCameraEid(null);
            this.renderContext = null;
        }
        this.engine = null;
        this.lastResolvedRenderCamera = undefined;
    }
}
