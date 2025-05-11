import { Context } from './index';
import {ISystem} from "../index";

export class SystemManager {
    private systems: ISystem[] = [];

    constructor(private readonly context: Context) {}

    register(system: ISystem): void {
        this.systems.push(system);
    }

    async initAll(): Promise<void> {
        for (const system of this.systems) {
            if (system.init) {
                await system.init(this.context);
            }
        }
    }

    update(deltaTime: number): void {
        for (const system of this.systems) {
            system.update(this.context, deltaTime);
        }
    }

    stopAll() {
        for (const system of this.systems) {
            if (system.stop) {
                system.stop(this.context);
            }
        }
    }

    clear(): void {
        this.systems = [];
    }
}
