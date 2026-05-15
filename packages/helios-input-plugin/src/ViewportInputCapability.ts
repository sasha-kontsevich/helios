/** Frame input for game viewport; registered by {@link ViewportInputPlugin}. */
export const VIEWPORT_INPUT_CAPABILITY = "game.viewportInput" as const;

const FLY_KEY_CODES = ["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE"] as const;

/**
 * Mutable input snapshot (DOM bridge writes, camera systems read).
 * Call {@link beginFrame} once per simulation tick before camera systems.
 */
export class ViewportInputState {
    /** False when editor shell is on the editor tab (if shell capability is present). */
    enabled = true;

    readonly keysDown = new Set<string>();

    flyActive = false;

    altHeld = false;

    shiftHeld = false;

    lookDeltaX = 0;

    lookDeltaY = 0;

    beginFrame(): void {
        this.lookDeltaX = 0;
        this.lookDeltaY = 0;
    }

    endFly(): void {
        this.flyActive = false;
        this.keysDown.clear();
    }

    shouldAcceptFlyKey(code: string): boolean {
        return (FLY_KEY_CODES as readonly string[]).includes(code);
    }
}
