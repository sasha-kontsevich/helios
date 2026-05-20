import "./componentMapAugment";
import { Engine } from "@merlinn/helios-core";
import { createEditor } from "@merlinn/helios-editor";
import { AstrisGameHudPlugin } from "./gameUi/AstrisGameHudPlugin";
import {
    ASTRIS_GOL_STATS_CAPABILITY,
    ASTRIS_GRID_CLICK_QUEUE_CAPABILITY,
    type GolStatsState,
} from "./game/astrisCapabilities";
import type { GridClickQueue } from "./game/GridClickQueue";
import "@merlinn/helios-editor/style.css";
import { config } from "./config";

async function bootstrap() {
    const engine = new Engine();

    const root = document.getElementById("editor-root");
    if (!root) {
        throw new Error(
            "Missing #editor-root — editor/game canvases (#helios-editor-view, #helios-game-view) are created by the shell before engine.init.",
        );
    }

    const editor = createEditor({
        api: engine.api,
        root,
        gameUiPlugins: [new AstrisGameHudPlugin()],
        playMode: {
            shouldExcludeEntity: (_, snap) => {
                const name = snap.components.Name as { label?: string } | undefined;
                const label = name?.label;
                // Exclude the whole grid group: lines reference Grid root eid in Parent.
                return label === "Grid" || label === "GridLine";
            },
            onEnterPlay: () => {
                engine.api.getCapability<GridClickQueue>(ASTRIS_GRID_CLICK_QUEUE_CAPABILITY)?.clear();
                const stats = engine.api.getCapability<GolStatsState>(ASTRIS_GOL_STATS_CAPABILITY);
                if (stats) {
                    stats.generation = 0;
                }
            },
            onExitPlay: () => {
                engine.api.getCapability<GridClickQueue>(ASTRIS_GRID_CLICK_QUEUE_CAPABILITY)?.clear();
            },
        },
    });

    const assetIndexRes = await fetch("/assets/asset-index.json");
    const assetIndex = (await assetIndexRes.json()) as string[];

    await engine.init({ ...config, assetIndex });
    editor.attachEngine(engine);
    engine.start();
}

void bootstrap();
