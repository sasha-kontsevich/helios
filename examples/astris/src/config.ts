import * as Components from "./components";
import {Systems} from "./systems";
import {Builders} from "./builders";
import {EngineConfig} from "@merlinn/helios-core";
import {Plugins} from "./plugins";

export const config: EngineConfig = {
    components: Components,
    systems: Systems,
    builders: Builders,
    plugins: Plugins,
};
