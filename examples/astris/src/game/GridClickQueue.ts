export type GridCellActionMode = "toggle" | "place";

export type GridCellClick = { gx: number; gz: number; mode: GridCellActionMode };

export class GridClickQueue {
    private pending: GridCellClick[] = [];

    enqueue(gx: number, gz: number, mode: GridCellActionMode = "toggle"): void {
        this.pending.push({ gx, gz, mode });
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
