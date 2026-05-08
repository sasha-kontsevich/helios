import {SystemConstructor} from "./SystemConstructor";
import type { HeliosPlugin } from "./HeliosPlugin";
import type { EngineBuilder } from "../engine/BuilderManger";

export type EngineConfig = {
    components: Record<string, unknown>,
    systems: SystemConstructor[],
    builders?: EngineBuilder[],
    plugins: HeliosPlugin[],
    /**
     * Paths passed to {@link AssetDatabase.indexMeta} (relative to `/assets`, e.g. `scenes/main.json`).
     */
    assetIndex?: string[],
    /** Load this scene after plugins `initAll`; requires indexing and registered loaders for `loadScene`. */
    initialSceneGuid?: string,
};
