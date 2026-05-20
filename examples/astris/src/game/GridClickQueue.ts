export type GridCellActionMode = "toggle" | "place" | "erase";

export type GridCellClick = { gx: number; gz: number; mode: GridCellActionMode };

export class GridClickQueue {
    private pending: GridCellClick[] = [];

    enqueue(gx: number, gz: number, mode: GridCellActionMode = "toggle"): void {
        this.pending.push({ gx, gz, mode });
    }

    drain(): GridCellClick[] {
        const out = this.pending;
        this.pending = [];
        return out;
    }

    clear(): void {
        this.pending = [];
    }
}
