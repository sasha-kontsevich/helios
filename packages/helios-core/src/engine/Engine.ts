import { Context } from './Context';
import * as Components from "../components"

export class Engine {
    readonly context: Context;
    private running: boolean = false;
    private lastTime: number = 0;

    constructor() {
        this.context = new Context(this);
    }

    async init(assetIndex: string[]) {
        console.log("Initializing engine");
        this.context.components.registerAll(Components);

        await this.context.plugins.initAll();

        await this.context.systems.initAll();

        await this.context.assetDatabase.indexMeta(assetIndex);

        // const prefabGuids: string[] = [ /* список GUID префабов */ ];
        // await this.context.assetDatabase.preloadJson(prefabGuids);
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
    }

    private loop = (currentTime: number) => {
        if (!this.running) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(deltaTime);
        requestAnimationFrame(this.loop);
    }

    private update(deltaTime: number) {
        // Обновляем все системы по порядку
        this.context.systems.update(deltaTime);
    }

    stop() {
        this.running = false;
    }

    public getContext() {
        return this.context;
    }
}
