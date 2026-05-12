/** Base drag sensitivity; scaled by magnitude and pointer speed (matches legacy inspector). */
export function getNumericScrubStep(event: PointerEvent): number {
    const base = 0.02;
    if (event.shiftKey) return base * 0.2;
    if (event.altKey) return base * 8;
    return base;
}

function clampFinite(n: number, fallback: number): number {
    return Number.isFinite(n) ? n : fallback;
}

export interface AttachNumericScrubParams {
    event: PointerEvent;
    getValue: () => number;
    /** Called with each committed value while dragging. */
    commit: (next: number) => void;
    onEditingStart?: () => void;
    onEditingEnd?: () => void;
}

/**
 * Horizontal drag on a label to change a numeric value (Unity/Blender-style scrub).
 * Uses pointer capture on `event.currentTarget` when available.
 */
export function attachNumericScrub(params: AttachNumericScrubParams): void {
    const { event, getValue, commit, onEditingStart, onEditingEnd } = params;
    if (event.button !== 0) return;
    event.preventDefault();

    let active = true;
    const pointerId = event.pointerId;
    let lastClientX = event.clientX;
    let lastTime = event.timeStamp || performance.now();
    let lastAppliedValue = getValue();

    onEditingStart?.();
    (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);

    function onMove(ev: PointerEvent): void {
        if (!active || ev.pointerId !== pointerId) return;
        ev.preventDefault();
        const now = ev.timeStamp || performance.now();
        const dtMs = Math.max(1, now - lastTime);
        const dxStep = ev.clientX - lastClientX;
        lastClientX = ev.clientX;
        lastTime = now;
        const baseStep = getNumericScrubStep(ev);
        const mag = Math.max(1, Math.abs(lastAppliedValue));
        const magnitudeFactor = 0.02 * mag + 1;
        const pxPerMs = Math.abs(dxStep) / dtMs;
        const speedFactor = Math.min(12, Math.max(0.25, pxPerMs * 6));
        const delta = dxStep * baseStep * magnitudeFactor * speedFactor;
        const next = clampFinite(lastAppliedValue + delta, lastAppliedValue);
        if (next !== lastAppliedValue) {
            lastAppliedValue = next;
            commit(next);
        }
    }

    function onUp(ev: PointerEvent): void {
        if (!active || ev.pointerId !== pointerId) return;
        ev.preventDefault();
        active = false;
        onEditingEnd?.();
        window.removeEventListener("pointermove", onMove as EventListener);
        window.removeEventListener("pointerup", onUp as EventListener);
        window.removeEventListener("pointercancel", onUp as EventListener);
    }

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp, { passive: false });
    window.addEventListener("pointercancel", onUp, { passive: false });
}
