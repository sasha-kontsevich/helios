import "./componentMapAugment";
import { Engine } from "@merlinn/helios-core";
import { createEditor } from "@merlinn/helios-editor";
import { ASTRIS_GRID_CLICK_QUEUE_CAPABILITY } from "./game/gridInputCapabilities";
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
        playMode: {
            shouldExcludeEntity: (_, snap) => {
                const name = snap.components.Name as { label?: string } | undefined;
                return name?.label === "Grid";
            },
            onEnterPlay: () => {
                engine.api.getCapability<GridClickQueue>(ASTRIS_GRID_CLICK_QUEUE_CAPABILITY)?.clear();
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
