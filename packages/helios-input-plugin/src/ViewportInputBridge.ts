import {
    EDITOR_SHELL_ACTIVE_VIEW_CAPABILITY,
    type EditorShellActiveViewState,
    type Context,
} from "@merlinn/helios-core";
import type { ViewportInputState } from "./ViewportInputCapability";

export class ViewportInputBridge {
    private canvas: HTMLCanvasElement | null = null;

    private readonly boundCtxMenu = (e: Event) => e.preventDefault();
    private readonly boundPointerDown = (e: PointerEvent) => this.onPointerDown(e);
    private readonly boundPointerUp = (e: PointerEvent) => this.onPointerUp(e);
    private readonly boundPointerMove = (e: PointerEvent) => this.onPointerMove(e);
    private readonly boundKeyDown = (e: KeyboardEvent) => this.onKeyDown(e);
    private readonly boundKeyUp = (e: KeyboardEvent) => this.onKeyUp(e);
    private readonly boundBlur = () => this.onWindowBlur();

    constructor(
        private readonly context: Context,
        private readonly state: ViewportInputState,
    ) {}

    attach(canvas: HTMLCanvasElement): void {
        this.detach();
        this.canvas = canvas;

        canvas.addEventListener("contextmenu", this.boundCtxMenu);
        canvas.addEventListener("pointerdown", this.boundPointerDown);
        canvas.addEventListener("pointerup", this.boundPointerUp);
        canvas.addEventListener("pointermove", this.boundPointerMove);
        window.addEventListener("keydown", this.boundKeyDown);
        window.addEventListener("keyup", this.boundKeyUp);
        window.addEventListener("blur", this.boundBlur);
    }

    detach(): void {
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
        this.state.endFly();
    }

    private refreshEnabled(): void {
        const shell = this.context.capabilities.getOrUndefined<EditorShellActiveViewState>(
            EDITOR_SHELL_ACTIVE_VIEW_CAPABILITY,
        );
        const enabled = !shell || shell.activeView === "game";
        this.state.enabled = enabled;
        if (!enabled) {
            this.state.endFly();
        }
    }

    private onPointerDown(e: PointerEvent): void {
        this.refreshEnabled();
        if (!this.state.enabled || e.button !== 2) {
            return;
        }
        this.state.flyActive = true;
        try {
            (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
        } catch {
            // ignore
        }
    }

    private onPointerUp(e: PointerEvent): void {
        if (e.button !== 2) {
            return;
        }
        this.state.endFly();
        try {
            (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId);
        } catch {
            // ignore
        }
    }

    private onPointerMove(e: PointerEvent): void {
        this.refreshEnabled();
        if (!this.state.enabled || !this.state.flyActive || (e.buttons & 2) === 0) {
            return;
        }
        this.state.lookDeltaX += e.movementX;
        this.state.lookDeltaY += e.movementY;
    }

    private syncAltFromKeyboardEvent(e: KeyboardEvent): void {
        this.state.altHeld = e.getModifierState("Alt");
    }

    private onKeyDown(e: KeyboardEvent): void {
        this.refreshEnabled();
        this.syncAltFromKeyboardEvent(e);
        if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
            this.state.shiftHeld = true;
            return;
        }
        if (!this.state.enabled || !this.state.flyActive || !this.state.shouldAcceptFlyKey(e.code)) {
            return;
        }
        this.state.keysDown.add(e.code);
        e.preventDefault();
    }

    private onKeyUp(e: KeyboardEvent): void {
        this.syncAltFromKeyboardEvent(e);
        if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
            this.state.shiftHeld = false;
            return;
        }
        this.state.keysDown.delete(e.code);
    }

    private onWindowBlur(): void {
        this.state.shiftHeld = false;
        this.state.altHeld = false;
        this.state.endFly();
    }
}
