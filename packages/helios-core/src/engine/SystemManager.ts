import { Context } from './index';
import {ISystem, SystemConstructor} from "../index";

export class SystemManager {
    private systems: ISystem[] = [];

    constructor(private readonly context: Context) {}

    register(systems: (SystemConstructor | ISystem)[]) {
        for (const s of systems) {
            const instance = typeof s === 'function' ? new s(this.context) : s;
            this.systems.push(instance);
        }
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
