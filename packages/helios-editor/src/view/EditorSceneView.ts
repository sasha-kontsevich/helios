import type { Engine } from "@merlinn/helios-core";
import { THREE_RENDERER_CAPABILITY, type ThreeRenderContext } from "@merlinn/helios-three-plugin";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const FLY_MOVE_SPEED = 6;
const FLY_SHIFT_SPEED_MULT = 3;
const FLY_LOOK_SENS = 0.0025;
const FLY_MAX_PITCH = Math.PI / 2 - 0.02;

const FLY_CODES = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE"]);

/**
 * Wires an editor-only orbit camera to {@link ThreeRenderContext} (not ECS, not `worldRoot`).
 * Hold **RMB** for first-person style fly: mouse looks, **W/S** on horizontal plane, **A/D** strafe,
 * **Q/E** world down/up. **Shift** multiplies move speed while flying. Orbit pivot stays in front
 * of the camera. While RMB fly is active, {@link OrbitControls} is disabled and not updated.
 */
export class EditorSceneView {
    private engine: Engine | null = null;
    private renderContext: ThreeRenderContext | null = null;
    private controls: OrbitControls | null = null;
    private camera: THREE.PerspectiveCamera | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private rafId = 0;
    /** Last camera returned by {@link ThreeRenderContext.resolveRenderCamera} (controls attach to the free editor camera only). */
    private lastResolvedRenderCamera: THREE.Camera | undefined = undefined;

    private flyActive = false;
    private readonly keysDown = new Set<string>();
    private shiftHeld = false;
    private lastTickTime = 0;

    /** Full 3D view direction (for orbit sync). */
    private readonly tmpViewDir = new THREE.Vector3();
    /** Horizontal (XZ) forward for W/S — Unity fly on the ground plane. */
    private readonly tmpForward = new THREE.Vector3();
    private readonly tmpRight = new THREE.Vector3();
    private readonly tmpMove = new THREE.Vector3();
    private readonly tmpWorldUp = new THREE.Vector3(0, 1, 0);
    private readonly tmpEuler = new THREE.Euler();

    private boundCtxMenu!: (e: Event) => void;
    private boundPointerDown!: (e: PointerEvent) => void;
    private boundPointerUp!: (e: PointerEvent) => void;
    private boundPointerMove!: (e: PointerEvent) => void;
    private boundKeyDown!: (e: KeyboardEvent) => void;
    private boundKeyUp!: (e: KeyboardEvent) => void;
    private boundBlur!: () => void;

    attach(engine: Engine): void {
        this.detach();

        const rc = engine.context.capabilities.get<ThreeRenderContext>(THREE_RENDERER_CAPABILITY);
        this.engine = engine;
        this.renderContext = rc;
        rc.setRenderView("editor");

        const canvas = rc.getCanvas();
        if (!canvas) {
            throw new Error("[EditorSceneView] Three canvas is not available yet.");
        }
        this.canvas = canvas;

        this.lastResolvedRenderCamera = undefined;
        this.ensureControlsMatchRenderCamera();

        this.boundCtxMenu = (e: Event) => e.preventDefault();
        this.boundPointerDown = this.onPointerDown.bind(this);
        this.boundPointerUp = this.onPointerUp.bind(this);
        this.boundPointerMove = this.onPointerMove.bind(this);
        this.boundKeyDown = this.onKeyDown.bind(this);
        this.boundKeyUp = this.onKeyUp.bind(this);
        this.boundBlur = this.onWindowBlur.bind(this);

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

            if (this.flyActive && this.camera && this.isFreeEditorCamera()) {
                this.applyFlyMove(dt);
            } else {
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
        const resolved = this.renderContext.resolveRenderCamera(world);
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
        }
    }

    private onPointerDown(e: PointerEvent): void {
        if (e.button !== 2 || !this.controls || !this.camera || !this.canvas || !this.isFreeEditorCamera()) return;
        this.flyActive = true;
        this.controls.enabled = false;
        try {
            this.canvas.setPointerCapture(e.pointerId);
        } catch {
            // ignore
        }
    }

    private onPointerUp(e: PointerEvent): void {
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
        if (this.controls) {
            this.controls.enabled = true;
        }
    }

    /** After fly, keep orbit pivot in front of the camera so orbit does not jump. */
    private syncOrbitTargetToView(): void {
        if (!this.controls || !this.camera) return;
        this.camera.getWorldDirection(this.tmpViewDir);
        this.controls.target.copy(this.camera.position).addScaledVector(this.tmpViewDir, 5);
    }

    private onPointerMove(e: PointerEvent): void {
        if (!this.flyActive || !this.camera || !this.isFreeEditorCamera() || (e.buttons & 2) === 0) return;

        this.camera.rotation.y -= e.movementX * FLY_LOOK_SENS;
        this.camera.rotation.x -= e.movementY * FLY_LOOK_SENS;
        this.camera.rotation.x = THREE.MathUtils.clamp(this.camera.rotation.x, -FLY_MAX_PITCH, FLY_MAX_PITCH);
    }

    private onWindowBlur(): void {
        this.shiftHeld = false;
        this.endFly();
    }

    private onKeyDown(e: KeyboardEvent): void {
        if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
            this.shiftHeld = true;
            return;
        }
        if (!this.flyActive || !this.isFreeEditorCamera() || !FLY_CODES.has(e.code)) return;
        this.keysDown.add(e.code);
        e.preventDefault();
    }

    private onKeyUp(e: KeyboardEvent): void {
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
        this.endFly();

        if (this.canvas) {
            this.canvas.removeEventListener("contextmenu", this.boundCtxMenu);
            this.canvas.removeEventListener("pointerdown", this.boundPointerDown);
            this.canvas.removeEventListener("pointerup", this.boundPointerUp);
            this.canvas.removeEventListener("pointermove", this.boundPointerMove);
            this.canvas = null;
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
            this.renderContext.setRenderView("game");
            this.renderContext = null;
        }
        this.engine = null;
        this.lastResolvedRenderCamera = undefined;
    }
}
