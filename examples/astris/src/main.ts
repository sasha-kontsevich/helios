import {Engine} from "@merlinn/helios-core";
import {config} from "./config";
import {Editor} from "@merlinn/helios-editor/src/Editor";

const engine = new Engine();

await engine.init(config);

engine.start();

const editor = new Editor(engine.api);
