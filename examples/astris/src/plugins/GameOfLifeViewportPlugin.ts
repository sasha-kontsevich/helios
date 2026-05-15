import { Context, Plugin } from "@merlinn/helios-core";
import { GAME_VIEWPORT_POINTER_SINK_CAPABILITY } from "@merlinn/helios-editor";
import { AstrisGridPointerSink } from "../game/AstrisGridPointerSink";
import { GridClickQueue } from "../game/GridClickQueue";
import { ASTRIS_GRID_CLICK_QUEUE_CAPABILITY } from "../game/gridInputCapabilities";
import { ASTRIS_GAME_OF_LIFE_RUNTIME_CAPABILITY } from "../game/gameOfLifeCapabilities";
import { GameOfLifeRuntime } from "../game/GameOfLifeRuntime";

/**
 * Registers grid click queue + pointer sink for editor **game** viewport mode.
 */
export class GameOfLifeViewportPlugin extends Plugin {
    public readonly id = "astris.gameOfLifeViewport";
    public readonly version = "0.0.1";

    private readonly queue = new GridClickQueue();
    private readonly sink = new AstrisGridPointerSink(this.queue);
    private readonly runtime = new GameOfLifeRuntime();

    constructor() {
        super();
    }

    public setup(context: Context): void {
        super.setup(context);
        context.capabilities.register(GAME_VIEWPORT_POINTER_SINK_CAPABILITY, this.sink);
        context.capabilities.register(ASTRIS_GRID_CLICK_QUEUE_CAPABILITY, this.queue);
        context.capabilities.register(ASTRIS_GAME_OF_LIFE_RUNTIME_CAPABILITY, this.runtime);
    }

    public dispose(): void {
        const ctx = this.getContext();
        ctx.capabilities.delete(GAME_VIEWPORT_POINTER_SINK_CAPABILITY);
        ctx.capabilities.delete(ASTRIS_GRID_CLICK_QUEUE_CAPABILITY);
        ctx.capabilities.delete(ASTRIS_GAME_OF_LIFE_RUNTIME_CAPABILITY);
        super.dispose();
    }
}
