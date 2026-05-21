import type { Engine } from "@merlinn/helios-core";
import type { IGameViewportPointerSink } from "@merlinn/helios-editor";
import {
    ASTRIS_GOL_ARMED_PRESET_CAPABILITY,
    type GolArmedPresetState,
    type GolToolMode,
    type GolToolState,
    ASTRIS_GOL_TOOL_CAPABILITY,
} from "./astrisCapabilities";
import type { GridClickQueue } from "./GridClickQueue";
import { getLivingCellKeys } from "./golCellIndex";
import { applyGolPreset } from "./golPresets";
import { clearGolHover, updateGolHoverFromCell } from "./golHoverLogic";
import { pickGridCell } from "./gridPlanePick";

/**
 * LMB → grid plane. Paint: toggle + drag place. Erase: remove. Armed preset: place on click.
 */
export class AstrisGridPointerSink implements IGameViewportPointerSink {
    private lastStrokeGx: number | null = null;
    private lastStrokeGz: number | null = null;

    constructor(private readonly queue: GridClickQueue) {}

    tryHandlePointerDown(engine: Engine, canvas: HTMLCanvasElement, e: PointerEvent): boolean {
        this.resetStroke();
        const cell = pickGridCell(engine, canvas, e);
        if (cell === null) {
            return true;
        }

        const armed = engine.context.capabilities.getOrUndefined<GolArmedPresetState>(
            ASTRIS_GOL_ARMED_PRESET_CAPABILITY,
        );
        if (armed?.presetId) {
            applyGolPreset(engine.api, armed.presetId, cell.gx, cell.gz, getLivingCellKeys(engine));
            updateGolHoverFromCell(engine, cell.gx, cell.gz);
            return true;
        }

        const tool = this.getToolMode(engine);
        if (tool === "erase") {
            this.queue.enqueue(cell.gx, cell.gz, "erase");
        } else {
            this.queue.enqueue(cell.gx, cell.gz, "toggle");
        }
        return true;
    }

    tryHandlePointerMove(engine: Engine, canvas: HTMLCanvasElement, e: PointerEvent): boolean {
        if ((e.buttons & 1) === 0) {
            return false;
        }
        const cell = pickGridCell(engine, canvas, e);
        if (cell === null) {
            return true;
        }
        if (cell.gx === this.lastStrokeGx && cell.gz === this.lastStrokeGz) {
            return true;
        }
        this.lastStrokeGx = cell.gx;
        this.lastStrokeGz = cell.gz;

        const armed = engine.context.capabilities.getOrUndefined<GolArmedPresetState>(
            ASTRIS_GOL_ARMED_PRESET_CAPABILITY,
        );
        if (armed?.presetId) {
            return true;
        }

        const tool = this.getToolMode(engine);
        this.queue.enqueue(cell.gx, cell.gz, tool === "erase" ? "erase" : "place");
        return true;
    }

    tryHandlePointerHover(engine: Engine, canvas: HTMLCanvasElement, e: PointerEvent): void {
        const cell = pickGridCell(engine, canvas, e);
        if (cell === null) {
            clearGolHover(engine);
            return;
        }
        updateGolHoverFromCell(engine, cell.gx, cell.gz);
    }

    tryHandlePointerLeave(_engine: Engine, _canvas: HTMLCanvasElement): void {
        clearGolHover(_engine);
    }

    private getToolMode(engine: Engine): GolToolMode {
        return engine.context.capabilities.getOrUndefined<GolToolState>(ASTRIS_GOL_TOOL_CAPABILITY)?.mode ?? "paint";
    }

    private resetStroke(): void {
        this.lastStrokeGx = null;
        this.lastStrokeGz = null;
    }
}
