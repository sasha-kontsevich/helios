import {SystemConstructor} from "./SystemConstructor";
import type { HeliosPlugin } from "./HeliosPlugin";

export type EngineConfig = {
    components: Record<string, unknown>,
    systems: SystemConstructor[],
    builders: any[],
    plugins: HeliosPlugin[],
};
