import {Engine} from "@merlinn/helios-core";
import {config} from "./config";
import {Editor} from "@merlinn/helios-editor/src/Editor";

async function bootstrap() {
    const engine = new Engine();

    await engine.init(config);
    engine.start();

    new Editor(engine.api);
}

void bootstrap();
