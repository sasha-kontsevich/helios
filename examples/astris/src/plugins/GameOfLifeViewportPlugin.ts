import { Context, Plugin } from "@merlinn/helios-core";
import { GAME_VIEWPORT_POINTER_SINK_CAPABILITY } from "@merlinn/helios-editor";
import { AstrisGridPointerSink } from "../game/AstrisGridPointerSink";
import { GridClickQueue } from "../game/GridClickQueue";
import {
    ASTRIS_GOL_ARMED_PRESET_CAPABILITY,
    ASTRIS_GOL_HOVER_CAPABILITY,
    ASTRIS_GOL_STATS_CAPABILITY,
    ASTRIS_GOL_TOOL_CAPABILITY,
    ASTRIS_GRID_CLICK_QUEUE_CAPABILITY,
    createDefaultGolArmedPresetState,
    createDefaultGolHoverState,
    createDefaultGolStatsState,
    createDefaultGolToolState,
} from "../game/astrisCapabilities";

/**
 * Registers grid input queue, tool/stats/hover state, and pointer sink for game viewport mode.
 */
export class GameOfLifeViewportPlugin extends Plugin {
    public readonly id = "astris.gameOfLifeViewport";
    public readonly version = "0.0.1";

    private readonly queue = new GridClickQueue();
    private readonly tool = createDefaultGolToolState();
    private readonly stats = createDefaultGolStatsState();
    private readonly hover = createDefaultGolHoverState();
    private readonly armedPreset = createDefaultGolArmedPresetState();
    private readonly sink = new AstrisGridPointerSink(this.queue);

    constructor() {
        super();
    }

    public setup(context: Context): void {
        super.setup(context);
        context.capabilities.register(GAME_VIEWPORT_POINTER_SINK_CAPABILITY, this.sink);
        context.capabilities.register(ASTRIS_GRID_CLICK_QUEUE_CAPABILITY, this.queue);
        context.capabilities.register(ASTRIS_GOL_TOOL_CAPABILITY, this.tool);
        context.capabilities.register(ASTRIS_GOL_STATS_CAPABILITY, this.stats);
        context.capabilities.register(ASTRIS_GOL_HOVER_CAPABILITY, this.hover);
        context.capabilities.register(ASTRIS_GOL_ARMED_PRESET_CAPABILITY, this.armedPreset);
    }

    public dispose(): void {
        const ctx = this.getContext();
        ctx.capabilities.delete(GAME_VIEWPORT_POINTER_SINK_CAPABILITY);
        ctx.capabilities.delete(ASTRIS_GRID_CLICK_QUEUE_CAPABILITY);
        ctx.capabilities.delete(ASTRIS_GOL_TOOL_CAPABILITY);
        ctx.capabilities.delete(ASTRIS_GOL_STATS_CAPABILITY);
        ctx.capabilities.delete(ASTRIS_GOL_HOVER_CAPABILITY);
        ctx.capabilities.delete(ASTRIS_GOL_ARMED_PRESET_CAPABILITY);
        super.dispose();
    }
}
