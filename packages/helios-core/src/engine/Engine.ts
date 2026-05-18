import { Context } from './Context';
import { EngineConfig } from '../types';
import { EngineAPI } from '../api/EngineAPI';
import { registerDefaultAssetLoaders } from './registerDefaultAssetLoaders';

/**
 * Initialization order:
 * 1. Components registered
 * 2. Plugins in dependency order (`setup`)
 * 3. Systems registered
 * 4. Plugins optional second phase (`init`) after systems exist
 *
 * Shutdown (`stop`): systems stopped → plugins `dispose` (reverse order) → capabilities cleared
 */
export class Engine {
    readonly context: Context;
    readonly api: EngineAPI;
    private running: boolean = false;
    private lastTime: number = 0;

    constructor() {
        this.context = new Context(this);
        this.api = new EngineAPI(this.context);
    }

    async init(config: EngineConfig) {
        registerDefaultAssetLoaders(this.context);

        if (config.assetIndex?.length) {
            await this.context.assetDatabase.indexMeta(config.assetIndex);
        }

        this.context.components.registerAll(config.components);

        await this.context.plugins.registerAll(config.plugins);

        this.context.systems.register(config.systems);

        await this.context.plugins.initAll();

        if (config.initialSceneGuid) {
            await this.context.scenes.loadScene(config.initialSceneGuid);
        }

        if (config.builders?.length) {
            this.context.builders.registerAll(config.builders);
            await this.context.builders.runAll(this.context);
        }
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.context.systems.startAll();
        requestAnimationFrame(this.loop);
    }

    private loop = (currentTime: number) => {
        if (!this.running) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        // if (1 <= 1/deltaTime && 1/deltaTime <= 61) {
            this.update(deltaTime);
        // }
        requestAnimationFrame(this.loop);
    }

    private update(deltaTime: number) {
        this.context.systems.update(deltaTime);
    }

    stop() {
        this.running = false;
        this.context.systems.stopAll();
        this.context.plugins.disposeAll();
    }

    public getContext() {
        return this.context;
    }
}
