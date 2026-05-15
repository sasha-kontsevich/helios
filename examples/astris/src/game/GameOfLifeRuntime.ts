import type { GameSimulationControls } from "@merlinn/helios-editor";

/** Pause / resume for {@link GameOfLifeStepSystem}. */
export class GameOfLifeRuntime implements GameSimulationControls {
    private _paused = false;

    get paused(): boolean {
        return this._paused;
    }

    togglePause(): void {
        this._paused = !this._paused;
    }

    /** Used when entering Play Mode so stepping is not stuck paused. */
    clearPause(): void {
        this._paused = false;
    }
}
