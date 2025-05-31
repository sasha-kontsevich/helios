import {Engine} from "@merlinn/helios-core";
import {config} from "./config";

const engine = new Engine();

await engine.init(config);

engine.start();
