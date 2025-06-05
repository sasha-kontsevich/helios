import { Context } from './Context';
import * as Components from "../components"
import {EngineConfig} from "../types";

export class Engine {
    readonly context: Context;
    private running: boolean = false;
    private lastTime: number = 0;

    constructor() {
        this.context = new Context(this);
        this.api = new
    }

    async init(config: EngineConfig) {
        console.log("Initializing engine");

        this.context.components.registerAll(config.components);

        this.context.plugins.registerAll(config.plugins);

        this.context.systems.register(config.systems);

        // await this.context.assetDatabase.indexMeta(assetIndex);

        // const prefabGuids: string[] = [ /* список GUID префабов */ ];
        // await this.context.assetDatabase.preloadJson(prefabGuids);
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
    }

    public getContext() {
        return this.context;
    }
}
