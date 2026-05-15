export type GridCellClick = { gx: number; gz: number };

export class GridClickQueue {
    private pending: GridCellClick[] = [];

    enqueue(gx: number, gz: number): void {
        this.pending.push({ gx, gz });
    }

    /** Returns and clears all pending clicks since last drain. */
    drain(): GridCellClick[] {
        const out = this.pending;
        this.pending = [];
        return out;
    }

    clear(): void {
        this.pending = [];
    }
}
