import { Engine } from "@merlinn/helios-core";
import { createEditor } from "@merlinn/helios-editor";
import "@merlinn/helios-editor/style.css";
import { config } from "./config";

async function bootstrap() {
    const engine = new Engine();

    const root = document.getElementById("editor-root");
    if (!root) {
        throw new Error('Missing #editor-root — canvas is created by the editor shell before engine.init.');
    }

    createEditor({ api: engine.api, root });

    await engine.init(config);
    engine.start();
}

void bootstrap();
