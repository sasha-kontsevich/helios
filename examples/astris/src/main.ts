import "./componentMapAugment";
import { Engine } from "@merlinn/helios-core";
import { createEditor } from "@merlinn/helios-editor";
import { ASTRIS_GAME_OF_LIFE_RUNTIME_CAPABILITY } from "./game/gameOfLifeCapabilities";
import { ASTRIS_GRID_CLICK_QUEUE_CAPABILITY } from "./game/gridInputCapabilities";
import type { GridClickQueue } from "./game/GridClickQueue";
import type { GameOfLifeRuntime } from "./game/GameOfLifeRuntime";
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
        gameSimulationCapabilityKey: ASTRIS_GAME_OF_LIFE_RUNTIME_CAPABILITY,
        playMode: {
            shouldExcludeEntity: (_, snap) => {
                const name = snap.components.Name as { label?: string } | undefined;
                return name?.label === "Grid";
            },
            onEnterPlay: () => {
                engine.api.getCapability<GridClickQueue>(ASTRIS_GRID_CLICK_QUEUE_CAPABILITY)?.clear();
                engine.api.getCapability<GameOfLifeRuntime>(ASTRIS_GAME_OF_LIFE_RUNTIME_CAPABILITY)?.clearPause();
            },
            onExitPlay: () => {
                engine.api.getCapability<GridClickQueue>(ASTRIS_GRID_CLICK_QUEUE_CAPABILITY)?.clear();
                engine.api.getCapability<GameOfLifeRuntime>(ASTRIS_GAME_OF_LIFE_RUNTIME_CAPABILITY)?.clearPause();
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
