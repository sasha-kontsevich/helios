import {
    EDITOR_SHELL_ACTIVE_VIEW_CAPABILITY,
    type Context,
    type EditorShellActiveViewState,
} from "@merlinn/helios-core";
import { ViewportInputButton, ViewportInputKey } from "./ViewportInputCapability";
import { ViewportInput } from "./components/ViewportInput";

function keyFlagForCode(code: string): number {
    switch (code) {
        case "KeyW": return ViewportInputKey.W;
        case "KeyA": return ViewportInputKey.A;
        case "KeyS": return ViewportInputKey.S;
        case "KeyD": return ViewportInputKey.D;
        case "KeyQ": return ViewportInputKey.Q;
        case "KeyE": return ViewportInputKey.E;
        case "ShiftLeft":
        case "ShiftRight":
            return ViewportInputKey.Shift;
        case "AltLeft":
        case "AltRight":
            return ViewportInputKey.Alt;
        default:
            return 0;
    }
}

function buttonFlagForButton(button: number): number {
    switch (button) {
        case 0: return ViewportInputButton.Left;
        case 1: return ViewportInputButton.Middle;
        case 2: return ViewportInputButton.Right;
        default: return 0;
    }
}

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
        private readonly inputEntity: number,
    ) {}

    attach(canvas: HTMLCanvasElement): void {
        this.detach();
        this.canvas = canvas;

        canvas.addEventListener("contextmenu", this.boundCtxMenu);
        canvas.addEventListener("pointerdown", this.boundPointerDown);
        canvas.addEventListener("pointerup", this.boundPointerUp);
        canvas.addEventListener("pointercancel", this.boundPointerUp);
        canvas.addEventListener("pointermove", this.boundPointerMove);
        window.addEventListener("keydown", this.boundKeyDown);
        window.addEventListener("keyup", this.boundKeyUp);
        window.addEventListener("blur", this.boundBlur);
        this.refreshEnabled();
    }

    detach(): void {
        if (this.canvas) {
            this.canvas.removeEventListener("contextmenu", this.boundCtxMenu);
            this.canvas.removeEventListener("pointerdown", this.boundPointerDown);
            this.canvas.removeEventListener("pointerup", this.boundPointerUp);
            this.canvas.removeEventListener("pointercancel", this.boundPointerUp);
            this.canvas.removeEventListener("pointermove", this.boundPointerMove);
            this.canvas = null;
        }
        window.removeEventListener("keydown", this.boundKeyDown);
        window.removeEventListener("keyup", this.boundKeyUp);
        window.removeEventListener("blur", this.boundBlur);
        this.clear();
    }

    refreshEnabled(): void {
        const shell = this.context.capabilities.getOrUndefined<EditorShellActiveViewState>(
            EDITOR_SHELL_ACTIVE_VIEW_CAPABILITY,
        );
        const enabled = !shell || shell.activeView === "game";
        ViewportInput.enabled[this.inputEntity] = enabled ? 1 : 0;
        if (!enabled) {
            this.clear();
        }
    }

    private clear(): void {
        ViewportInput.enabled[this.inputEntity] = 0;
        ViewportInput.keys[this.inputEntity] = 0;
        ViewportInput.buttons[this.inputEntity] = 0;
        ViewportInput.lookDeltaX[this.inputEntity] = 0;
        ViewportInput.lookDeltaY[this.inputEntity] = 0;
    }

    private onPointerDown(e: PointerEvent): void {
        this.refreshEnabled();
        if (ViewportInput.enabled[this.inputEntity] === 0) {
            return;
        }
        const flag = buttonFlagForButton(e.button);
        if (flag === 0) {
            return;
        }
        ViewportInput.buttons[this.inputEntity] |= flag;
        try {
            (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
        } catch {
            // ignore
        }
    }

    private onPointerUp(e: PointerEvent): void {
        const flag = buttonFlagForButton(e.button);
        if (flag !== 0) {
            ViewportInput.buttons[this.inputEntity] &= ~flag;
        }
        try {
            (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId);
        } catch {
            // ignore
        }
    }

    private onPointerMove(e: PointerEvent): void {
        this.refreshEnabled();
        if (ViewportInput.enabled[this.inputEntity] === 0) {
            return;
        }
        ViewportInput.lookDeltaX[this.inputEntity] += e.movementX;
        ViewportInput.lookDeltaY[this.inputEntity] += e.movementY;
    }

    private onKeyDown(e: KeyboardEvent): void {
        this.refreshEnabled();
        const flag = keyFlagForCode(e.code);
        if (flag === 0 || ViewportInput.enabled[this.inputEntity] === 0) {
            return;
        }
        ViewportInput.keys[this.inputEntity] |= flag;
        e.preventDefault();
    }

    private onKeyUp(e: KeyboardEvent): void {
        const flag = keyFlagForCode(e.code);
        if (flag !== 0) {
            ViewportInput.keys[this.inputEntity] &= ~flag;
        }
    }

    private onWindowBlur(): void {
        this.clear();
    }
}
