import {SystemConstructor} from "./SystemConstructor";
import {Plugin} from "../engine";

export type EngineConfig = {
    components: Record<string, unknown>,
    systems: SystemConstructor[],
    builders: any[],
    plugins: Plugin[],
}