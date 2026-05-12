import type { IViewportPointerGate } from "./IViewportPointerGate";
import type { ViewportPickContext } from "./ViewportPickContext";

type Entry = { priority: number; gate: IViewportPointerGate };

/**
 * Ordered list of {@link IViewportPointerGate} implementations. Lower `priority` runs first;
 * the first gate that returns `true` wins (short-circuit).
 */
export class CompositeViewportPointerGate implements IViewportPointerGate {
    private readonly entries: Entry[] = [];

    /**
     * @param priority Lower values run before higher values (e.g. `-100` before `0`).
     * @returns Unregister function.
     */
    register(gate: IViewportPointerGate, priority = 0): () => void {
        const entry: Entry = { priority, gate };
        this.entries.push(entry);
        this.sortEntries();
        return () => {
            const i = this.entries.indexOf(entry);
            if (i >= 0) {
                this.entries.splice(i, 1);
            }
        };
    }

    shouldSuppressEntityPickCapture(e: PointerEvent, ctx: ViewportPickContext): boolean {
        for (const { gate } of this.entries) {
            if (gate.shouldSuppressEntityPickCapture(e, ctx)) {
                return true;
            }
        }
        return false;
    }

    private sortEntries(): void {
        this.entries.sort((a, b) => a.priority - b.priority);
    }
}
